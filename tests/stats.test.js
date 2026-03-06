const test = require("node:test");
const assert = require("node:assert/strict");
const { buildStatsPayload, motherlodeHistory, winsPerBlock } = require("../lib/stats");

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
          timestamp: "2026-01-01T00:00:00Z"
        },
        {
          id: "2",
          winnerType: "split",
          winnerBlock: 2,
          motherlodeHit: false,
          timestamp: "2026-01-01T00:01:00Z"
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
