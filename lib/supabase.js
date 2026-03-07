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
  const roundNumber = toInteger(firstDefined(rawRound, ["roundId", "id", "_id", "round_id"]));
  if (roundNumber === null) {
    return null;
  }

  // Get timestamp and convert to ISO string
  const tsValue = firstDefined(rawRound, ["timestamp", "endTimestamp", "createdAt", "time"]);
  let timestamp = null;
  if (tsValue) {
    const tsNum = Number(tsValue);
    if (Number.isFinite(tsNum)) {
      // It's epoch milliseconds
      timestamp = new Date(tsNum).toISOString();
    } else {
      timestamp = new Date(tsValue).toISOString();
    }
  }

  return {
    round_number: roundNumber,
    block_number: toInteger(firstDefined(rawRound, ["block", "winnerBlock", "winningBlock", "blockNumber"])),
    winner_take_all: normalizeWinnerTakeAll(rawRound),
    round_timestamp: timestamp,
    raw_payload: JSON.stringify(rawRound),
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
      .upsert(batch, { onConflict: "round_number" });

    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }
  }

  return { ok: true, upserted: payload.length };
}

function normalizeRoundFromSupabase(row) {
  let timestampMs = null;
  if (row.round_timestamp) {
    timestampMs = new Date(row.round_timestamp).getTime();
  }
  const roundId = row.round_number !== null && row.round_number !== undefined ? String(row.round_number) : null;

  return {
    roundId,
    winnerTakeAll: Boolean(row.winner_take_all),
    block: row.block_number,
    motherlodeHit: false,
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
    .select("round_number, block_number, winner_take_all, round_timestamp")
    .order("round_timestamp", { ascending: false })
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
  const newest = data[0] && data[0].round_timestamp ? new Date(data[0].round_timestamp).getTime() : Date.now();

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
