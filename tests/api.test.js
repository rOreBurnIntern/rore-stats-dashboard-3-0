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

test("stats handler returns upstream data with normalized rounds", async () => {
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
            endTimestamp: "2026-01-01T00:00:00Z"
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
    assert.equal(res.body.source, "upstream");
    assert.equal(res.body.data.roundsProcessed, 1);
    assert.equal(res.body.data.rounds.length, 1);
    assert.equal(res.body.data.rounds[0].winnerTakeAll, false);
    assert.match(res.headers["cache-control"], /s-maxage=300/);
    assert.ok(res.body.lastUpdated);
  } finally {
    global.fetch = previousFetch;
  }
});

test("stats handler falls back to Supabase payload when upstream fails", async () => {
  const previousFetch = global.fetch;
  const previousFallback = handler.getFallbackStats;

  global.fetch = async () => {
    throw new Error("upstream unavailable");
  };

  handler.getFallbackStats = async () => ({
    lastUpdated: "2026-03-07T10:00:00.000Z",
    rounds: [{ id: "1", winnerTakeAll: true, winnerBlock: 2, motherlodeHit: false, endTimestamp: "2026-03-07T09:00:00.000Z" }],
    data: {
      stats: { motherlode: null, weth: null, rore: null },
      roundsProcessed: 1,
      pie: { winnerTakeAll: 1, split: 0 },
      bar: Array.from({ length: 26 }, (_, block) => ({ block, wins: 0 })),
      line: [{ x: "1", motherlodeValue: 0.2 }]
    }
  });

  try {
    const res = createMockResponse();
    await handler({}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.source, "supabase-fallback");
    assert.equal(res.body.data.rounds.length, 1);
    assert.equal(res.body.lastUpdated, "2026-03-07T10:00:00.000Z");
  } finally {
    global.fetch = previousFetch;
    handler.getFallbackStats = previousFallback;
  }
});

test("stats handler returns 502 when upstream and fallback both fail", async () => {
  const previousFetch = global.fetch;
  const previousFallback = handler.getFallbackStats;

  global.fetch = async () => {
    throw new Error("upstream unavailable");
  };
  handler.getFallbackStats = async () => null;

  try {
    const res = createMockResponse();
    await handler({}, res);

    assert.equal(res.statusCode, 502);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error, "Upstream data unavailable");
  } finally {
    global.fetch = previousFetch;
    handler.getFallbackStats = previousFallback;
  }
});
