#!/usr/bin/env node
const https = require('https');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = '7484dddd3ac2cc66475ac6779bf35ef5';
const API_EXPLORE = 'https://api.rore.supply/api/explore';
const API_PRICES = 'https://api.rore.supply/api/prices';

function fetchJSON(url, includeAuth = false) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'rORE-Stats/1.0' };
    if (includeAuth && GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
      headers['Accept'] = 'application/vnd.github+json';
    }
    
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { 
          const parsed = JSON.parse(data);
          if (parsed.error || parsed.message) {
            reject(new Error(parsed.message || parsed.error));
          } else {
            resolve(parsed);
          }
        } catch(e) { 
          reject(e); 
        }
      });
    });
    req.on('error', reject);
  });
}

async function main() {
  console.log('Fetching rORE data...');
  const [explore, prices] = await Promise.all([
    fetchJSON(API_EXPLORE),
    fetchJSON(API_PRICES).catch(() => null)
  ]);
  
  if (!explore || !explore.roundsData) {
    console.log('Failed to fetch data');
    process.exit(1);
  }
  
  console.log(`Got ${explore.roundsData.length} rounds from API`);
  
  // Get current motherlode value
  const currentMotherlodeWei = explore.protocolStats?.motherlode || '0';
  const currentMotherlodeRore = Number(BigInt(currentMotherlodeWei) / BigInt(1e18));
  
  // Fetch current Gist content
  const gistUrl = `https://api.github.com/gists/${GIST_ID}`;
  const gistRes = await fetchJSON(gistUrl, true);
  
  let storedRounds = [];
  try {
    storedRounds = JSON.parse(gistRes.files['rore-data.json'].content).rounds || [];
  } catch(e) {
    console.log('No existing rounds found');
  }
  
  console.log(`Current stored rounds: ${storedRounds.length}`);
  
  // Merge new rounds
  const existingIds = new Set(storedRounds.map(r => r.roundId));
  const newRounds = explore.roundsData
    .filter(r => !existingIds.has(r.roundId))
    .map(r => ({ ...r, motherlodeValue: currentMotherlodeRore }));
  
  console.log(`New rounds to add: ${newRounds.length}`);
  
  // Combine all rounds
  let allRounds = [...storedRounds, ...newRounds];
  
  // Keep last 10000 rounds
  if (allRounds.length > 10000) {
    allRounds = allRounds.slice(-10000);
  }
  
  const dataToSave = {
    rounds: allRounds,
    lastUpdated: new Date().toISOString(),
    prices: prices,
    motherlode: currentMotherlodeWei,
    currentRoundId: explore.roundsData[0]?.roundId
  };
  
  // Update Gist
  const contentStr = JSON.stringify(dataToSave, null, 2);
  const updateData = JSON.stringify({
    files: {
      'rore-data.json': { content: contentStr }
    }
  });
  
  const updateReq = await new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/gists/${GIST_ID}`,
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(updateData),
        'User-Agent': 'rORE-Stats/1.0'
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } 
        catch(e) { resolve({ error: e.message }); }
      });
    });
    req.on('error', reject);
    req.write(updateData);
    req.end();
  });
  
  if (updateReq.id) {
    console.log(`Updated Gist successfully! Total rounds: ${allRounds.length}`);
  } else {
    console.log('Update failed:', updateReq.error || updateReq.message);
  }
}

main().catch(console.error);
