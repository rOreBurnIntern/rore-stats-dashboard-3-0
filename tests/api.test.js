const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const handler = require("../api/stats");
const { getSyncState, openDatabase } = require("../lib/sqlite");

function createMockResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

function withTempDb(testFn) {
  return async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rore-stats-"));
    const dbPath = path.join(dir, "rore.db");
    const previousDbPath = process.env.RORE_DB_PATH;
    process.env.RORE_DB_PATH = dbPath;

    try {
      await testFn(dbPath);
    } finally {
      if (previousDbPath === undefined) {
        delete process.env.RORE_DB_PATH;
      } else {
        process.env.RORE_DB_PATH = previousDbPath;
      }
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}

test("fetchJsonWithRetry retries and returns parsed body", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls < 2) {
      throw new Error("temporary");
    }
    return {
      ok: true,
      json: async () => ({ ok: true })
    };
  };

  const body = await handler.fetchJsonWithRetry("https://example.com", {
    fetchImpl,
    retries: 2,
    timeoutMs: 200
  });

  assert.equal(calls, 2);
  assert.deepEqual(body, { ok: true });
});

test("stats handler refreshes from upstream and stores sync state", withTempDb(async () => {
  const responses = new Map([
    [
      "https://api.rore.supply/api/prices",
      { weth: "2010.45", ore: "0.1234" }
    ],
    [
      "https://api.rore.supply/api/explore?page=1",
      {
        protocolStats: { motherlode: "4200000000000000000" },
        rounds: [
          {
            roundId: 101,
            winnerType: "split",
            block: "#2",
            motherlodeHit: false,
            timestamp: "2026-01-01T00:00:00Z"
          }
        ],
        pagination: { hasNext: false }
      }
    ]
  ]);

  const previousFetch = global.fetch;
  global.fetch = async (url) => {
    if (!responses.has(url)) {
      return { ok: false, status: 404, json: async () => ({}) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => responses.get(url)
    };
  };

  try {
    const res = createMockResponse();
    await handler({}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.cacheHit, false);
    assert.equal(res.body.source, "api.rore.supply");
    assert.equal(res.body.data.roundsProcessed, 1);
    assert.match(res.headers["cache-control"], /s-maxage=300/);

    const db = openDatabase();
    try {
      const state = getSyncState(db);
      assert.ok(state);
      assert.equal(state.prices.weth, "2010.45");
    } finally {
      db.close();
    }
  } finally {
    global.fetch = previousFetch;
  }
}));

test("stats handler returns cached data when sync state is fresh", withTempDb(async () => {
  const seededResponses = new Map([
    [
      "https://api.rore.supply/api/prices",
      { weth: "2010.45", ore: "0.1234" }
    ],
    [
      "https://api.rore.supply/api/explore?page=1",
      {
        protocolStats: { motherlode: "4200000000000000000" },
        rounds: [
          {
            roundId: 202,
            winnerType: "winner take all",
            block: "#9",
            motherlodeHit: true,
            timestamp: "2026-01-01T00:01:00Z"
          }
        ],
        pagination: { hasNext: false }
      }
    ]
  ]);

  const previousFetch = global.fetch;
  global.fetch = async (url) => {
    if (!seededResponses.has(url)) {
      return { ok: false, status: 404, json: async () => ({}) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => seededResponses.get(url)
    };
  };

  await handler({}, createMockResponse());

  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    throw new Error("should not call upstream on cache hit");
  };

  try {
    const res = createMockResponse();
    await handler({}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.cacheHit, true);
    assert.equal(res.body.source, "sqlite-cache");
    assert.equal(calls, 0);
  } finally {
    global.fetch = previousFetch;
  }
}));
