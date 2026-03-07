const UPSTREAM_BASE = 'https://api.rore.supply';

export async function fetchJsonWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

export async function fetchExplorePages(maxPages = 200): Promise<any[]> {
  const pages = [];
  let page = 1;
  
  while (page <= maxPages) {
    try {
      const data = await fetchJsonWithRetry(`${UPSTREAM_BASE}/api/explore?page=${page}`);
      if (!data?.results?.length) break;
      pages.push(data);
      page++;
    } catch {
      break;
    }
  }
  
  return pages;
}

export { UPSTREAM_BASE };
