const { createClient } = require("@supabase/supabase-js");
const { buildStatsPayload } = require("./stats");

const MAX_FALLBACK_ROUNDS = 1000;

let cachedServiceClient = null;
let cachedAnonClient = null;

function getEnv(name) {
  const value = process.env[name];
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function firstDefined(object, fields) {
  for (const field of fields) {
    if (object[field] !== undefined && object[field] !== null) {
      return object[field];
    }
  }
  return null;
}

function toInteger(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const num = Number(String(value).replace(/^#/, "").trim());
  return Number.isFinite(num) ? Math.trunc(num) : null;
}

function toTimestampMs(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (numeric > 1e12) {
      return Math.trunc(numeric);
    }
    if (numeric > 1e9) {
      return Math.trunc(numeric * 1000);
    }
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeWinnerTakeAll(rawRound) {
  const explicit = firstDefined(rawRound, [
    "winnerTakeAll",
    "winner_take_all",
    "isWinnerTakeAll",
    "is_winner_take_all"
  ]);

  if (typeof explicit === "boolean") {
    return explicit;
  }
  if (typeof explicit === "string") {
    return explicit.toLowerCase() === "true";
  }

  const winnerType = String(firstDefined(rawRound, ["winnerType", "winner_type"]) || "").toLowerCase();
  return !winnerType.includes("split");
}

function getServiceClient() {
  if (cachedServiceClient) {
    return cachedServiceClient;
  }
  const url = getEnv("SUPABASE_URL");
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return null;
  }
  cachedServiceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return cachedServiceClient;
}

function getAnonClient() {
  if (cachedAnonClient) {
    return cachedAnonClient;
  }
  const url = getEnv("SUPABASE_URL");
  const key = getEnv("SUPABASE_ANON_KEY");
  if (!url || !key) {
    return null;
  }
  cachedAnonClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return cachedAnonClient;
}

function normalizeRoundForWrite(rawRound) {
  const roundId = toInteger(firstDefined(rawRound, ["roundId", "id", "_id", "round_id"]));
  if (roundId === null) {
    return null;
  }

  return {
    round_id: roundId,
    block: firstDefined(rawRound, ["block", "winnerBlock", "winningBlock", "blockNumber"]) || null,
    winner_take_all: normalizeWinnerTakeAll(rawRound),
    ore_winner: firstDefined(rawRound, ["oreWinner", "winner", "winnerAddress"]),
    motherlode: firstDefined(rawRound, ["motherlode", "motherlodeAmount"]),
    motherlode_hit: Boolean(firstDefined(rawRound, ["motherlodeHit", "isMotherlodeHit", "hitMotherlode"])),
    timestamp: toTimestampMs(firstDefined(rawRound, ["timestamp", "endTimestamp", "createdAt", "time"])),
    updated_at: new Date().toISOString()
  };
}

async function writeRoundsToSupabase(rounds) {
  const client = getServiceClient();
  if (!client) {
    return {
      ok: false,
      skipped: true,
      reason: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set"
    };
  }

  if (!Array.isArray(rounds) || rounds.length === 0) {
    return { ok: true, upserted: 0 };
  }

  const payload = rounds.map(normalizeRoundForWrite).filter(Boolean);
  if (payload.length === 0) {
    return { ok: true, upserted: 0 };
  }

  const BATCH_SIZE = 500;
  for (let i = 0; i < payload.length; i += BATCH_SIZE) {
    const batch = payload.slice(i, i + BATCH_SIZE);
    const { error } = await client
      .from("round_history")
      .upsert(batch, { onConflict: "round_id" });

    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }
  }

  return { ok: true, upserted: payload.length };
}

function normalizeRoundFromSupabase(row) {
  const timestampMs = toTimestampMs(row.timestamp);
  const roundId = row.round_id !== null && row.round_id !== undefined ? String(row.round_id) : null;

  return {
    roundId,
    winnerTakeAll: Boolean(row.winner_take_all),
    block: row.block,
    motherlodeHit: Boolean(row.motherlode_hit),
    timestamp: timestampMs ? new Date(timestampMs).toISOString() : null,
    endTimestamp: timestampMs ? new Date(timestampMs).toISOString() : null
  };
}

async function fetchFallbackPayloadFromSupabase() {
  const client = getServiceClient() || getAnonClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("round_history")
    .select("round_id, block, winner_take_all, motherlode_hit, timestamp")
    .order("timestamp", { ascending: false })
    .limit(MAX_FALLBACK_ROUNDS);

  if (error) {
    throw new Error(`Supabase fallback query failed: ${error.message}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const rounds = data
    .map(normalizeRoundFromSupabase)
    .reverse();

  const dataPayload = buildStatsPayload({}, [{ rounds }]);
  const newest = data[0] && data[0].timestamp ? toTimestampMs(data[0].timestamp) : Date.now();

  return {
    data: dataPayload,
    rounds,
    lastUpdated: new Date(newest || Date.now()).toISOString(),
    roundsFetched: rounds.length
  };
}

module.exports = {
  fetchFallbackPayloadFromSupabase,
  writeRoundsToSupabase
};
