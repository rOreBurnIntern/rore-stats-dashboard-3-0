const test = require("node:test");
const assert = require("node:assert/strict");
const { buildStatsPayload, filterRoundsLast24Hours, motherlodeHistory, winsPerBlock } = require("../lib/stats");

test("winsPerBlock always returns 25 bins including zeros", () => {
  const bins = winsPerBlock([
    { winnerBlock: 1 },
    { winnerBlock: 1 },
    { winnerBlock: 25 }
  ]);

  assert.equal(bins.length, 25);
  assert.equal(bins[0].wins, 2);
  assert.equal(bins[24].wins, 1);
  assert.equal(bins[13].wins, 0);
});

test("motherlodeHistory follows sawtooth +0.2 and reset on hit", () => {
  const points = motherlodeHistory([
    { id: "1", motherlodeHit: false },
    { id: "2", motherlodeHit: false },
    { id: "3", motherlodeHit: true },
    { id: "4", motherlodeHit: false },
    { id: "5", motherlodeHit: false }
  ]);

  assert.deepEqual(
    points.map((p) => p.motherlodeValue),
    [0.2, 0.4, 0.0, 0.2, 0.4]
  );
});

test("buildStatsPayload computes motherlode conversion + distribution", () => {
  const nowIso = new Date().toISOString();
  const pricesRaw = { weth: "2000", ore: "0.2" };
  const explorePagesRaw = [
    {
      protocolStats: {
        motherlode: "12000000000000000000"
      },
      rounds: [
        {
          id: "1",
          winnerType: "winner take all",
          winnerBlock: 1,
          motherlodeHit: false,
          timestamp: "2026-01-01T00:00:00Z",
          endTimestamp: nowIso
        },
        {
          id: "2",
          winnerType: "split",
          winnerBlock: 2,
          motherlodeHit: false,
          timestamp: "2026-01-01T00:01:00Z",
          endTimestamp: nowIso
        }
      ]
    }
  ];

  const payload = buildStatsPayload(pricesRaw, explorePagesRaw);
  assert.equal(payload.stats.motherlode, 12);
  assert.equal(payload.stats.weth, 2000);
  assert.equal(payload.stats.rore, 0.2);
  assert.equal(payload.pie.winnerTakeAll, 1);
  assert.equal(payload.pie.split, 1);
  assert.equal(payload.roundsProcessed, 2);
});

test("filterRoundsLast24Hours keeps only rounds ending in last 24h", () => {
  const now = Date.parse("2026-03-07T12:00:00Z");
  const rounds = [
    { id: "1", endTimestamp: "2026-03-07T11:59:59Z" },
    { id: "2", endTimestamp: "2026-03-06T12:00:00Z" },
    { id: "3", endTimestamp: "2026-03-06T11:59:59Z" },
    { id: "4", endTimestamp: null }
  ];
  const filtered = filterRoundsLast24Hours(rounds, now);
  assert.deepEqual(filtered.map((round) => round.id), ["1", "2"]);
});

test("buildStatsPayload uses roundId for line x labels and parses #block values", () => {
  const pricesRaw = {};
  const explorePagesRaw = [
    {
      rounds: [
        {
          roundId: 27421,
          winnerType: "split",
          block: "#4",
          motherlodeHit: false,
          timestamp: "2026-03-07T10:00:00Z",
          endTimestamp: "2026-03-07T10:01:59Z"
        },
        {
          roundId: 27422,
          winnerType: "winner take all",
          block: "#8",
          motherlodeHit: true,
          timestamp: "2026-03-07T10:02:00Z",
          endTimestamp: "2026-03-07T10:03:59Z"
        }
      ]
    }
  ];

  const payload = buildStatsPayload(pricesRaw, explorePagesRaw);
  assert.deepEqual(
    payload.line.map((point) => point.x),
    ["27421", "27422"]
  );
  assert.equal(payload.bar[3].wins, 1);
  assert.equal(payload.bar[7].wins, 1);
});
