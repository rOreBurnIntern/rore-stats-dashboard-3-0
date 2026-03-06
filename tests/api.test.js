const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/stats");

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

test("stats handler returns normalized payload with cache headers", async () => {
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
            id: "a",
            winnerType: "split",
            winnerBlock: 2,
            motherlodeHit: false,
            timestamp: "2026-01-01T00:00:00Z"
          }
        ],
        pagination: { hasNext: true, nextPage: 2 }
      }
    ],
    [
      "https://api.rore.supply/api/explore?page=2",
      {
        rounds: [
          {
            id: "b",
            winnerType: "winner take all",
            winnerBlock: 1,
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
    if (!responses.has(url)) {
      return { ok: false, status: 404, json: async () => ({}) };
    }
    const payload = responses.get(url);
    return {
      ok: true,
      status: 200,
      json: async () => payload
    };
  };

  try {
    const req = {};
    const res = createMockResponse();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.data.roundsProcessed, 2);
    assert.equal(res.body.data.stats.motherlode, 4.2);
    assert.equal(res.body.data.bar.length, 25);
    assert.match(res.headers["cache-control"], /s-maxage=30/);
  } finally {
    global.fetch = previousFetch;
  }
});
