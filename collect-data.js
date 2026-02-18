#!/usr/bin/env node
const https = require('https');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = '7484dddd3ac2cc66475ac6779bf35ef5';
const API_EXPLORE = 'https://api.rore.supply/api/explore';
const API_PRICES = 'https://api.rore.supply/api/prices';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function getCurrentData() {
  const [explore, prices] = await Promise.all([
    fetchJSON(API_EXPLORE),
    fetchJSON(API_PRICES).catch(() => null)
  ]);
  return { explore, prices };
}

async function getGist() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/gists/${GIST_ID}`,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'rORE-Stats-Collector'
      }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function updateGist(content) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      description: 'rORE historical round data for stats dashboard',
      files: {
        'rore-data.json': { content: JSON.stringify(content, null, 2) }
      }
    });
    
    const options = {
      hostname: 'api.github.com',
      path: `/gists/${GIST_ID}`,
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'rORE-Stats-Collector',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } 
        catch(e) { resolve({ ok: true }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Fetching rORE data...');
  const { explore, prices } = await getCurrentData();
  
  if (!explore || !explore.roundsData) {
    console.log('Failed to fetch data');
    process.exit(1);
  }
  
  console.log(`Got ${explore.roundsData.length} rounds`);
  
  // Get current Gist data
  let gist;
  try {
    gist = await getGist();
  } catch(e) {
    gist = { files: { 'rore-data.json': { content: '{"rounds":[]}' } } };
  }
  
  let stored;
  try {
    stored = JSON.parse(gist.files['rore-data.json'].content);
  } catch(e) {
    stored = { rounds: [], lastUpdated: null };
  }
  
  // Get current motherlode value
  const currentMotherlodeWei = explore.protocolStats?.motherlode || '0';
  const currentMotherlodeRore = Number(BigInt(currentMotherlodeWei) / BigInt(1e18));
  
  // Merge new rounds (avoid duplicates), adding current motherlode to each
  const existingIds = new Set((stored.rounds || []).map(r => r.roundId));
  const newRounds = explore.roundsData
    .filter(r => !existingIds.has(r.roundId))
    .map(r => ({ ...r, motherlodeValue: currentMotherlodeRore }));
  
  if (newRounds.length > 0) {
    console.log(`Adding ${newRounds.length} new rounds`);
    stored.rounds = [...(stored.rounds || []), ...newRounds];
    
    // Keep last 7 days of data (~10,000 rounds max)
    if (stored.rounds.length > 10000) {
      stored.rounds = stored.rounds.slice(-10000);
    }
  }
  
  stored.lastUpdated = new Date().toISOString();
  stored.prices = prices;
  stored.motherlode = explore.protocolStats?.motherlode || '0';
  stored.currentRoundId = explore.roundsData?.[0]?.roundId;
  
  await updateGist(stored);
  console.log(`Updated Gist. Total rounds: ${stored.rounds.length}`);
}

main().catch(console.error);
