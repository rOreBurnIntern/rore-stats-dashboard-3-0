import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface CurrentPrice {
  rORE: number;
  WETH: number;
}

interface BlockPerformanceEntry {
  block: number;
  wins: number;
  percentage: number;
}

interface WinnerTypesDistribution {
  WINNER_TAKE_ALL: number;
  SPLIT_EVENLY: number;
}

interface MotherlodeHistoryEntry {
  round_id: number;
  motherlode_running: number;
}

export interface DbStatsData {
  currentPrice: CurrentPrice;
  motherlodeTotal: number;
  totalORELocked: number;
  blockPerformance: BlockPerformanceEntry[];
  winnerTypesDistribution: WinnerTypesDistribution;
  motherlodeHistory: MotherlodeHistoryEntry[];
}

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("[getDbStatsData] Missing SUPABASE_URL or SUPABASE keys");
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

async function getDbStatsData(): Promise<DbStatsData | null> {
  const client = getSupabaseClient();
  if (!client) {
    console.error("[getDbStatsData] Cannot initialize Supabase client");
    return null;
  }

  try {
    // 1. Fetch current prices (latest entries from prices table)
    const { data: priceData, error: priceError } = await client
      .from("prices")
      .select("token, price, updated_at")
      .order("updated_at", { ascending: false })
      .limit(10); // Get recent to find latest for each token

    if (priceError) {
      throw new Error(`Prices query failed: ${priceError.message}`);
    }

    // Extract latest rORE and WETH prices
    let rOREPrice: number | null = null;
    let wethPrice: number | null = null;

    if (Array.isArray(priceData) && priceData.length > 0) {
      // Group by token and take the most recent for each
      const latestByToken = new Map<string, { price: number; updated_at: string }>();
      for (const row of priceData) {
        const existing = latestByToken.get(row.token);
        if (!existing || new Date(row.updated_at) > new Date(existing.updated_at)) {
          latestByToken.set(row.token, { price: Number(row.price), updated_at: row.updated_at });
        }
      }

      // Assuming token names: 'rORE' or 'ORE' for rORE, 'WETH' or 'ETH' for WETH
      latestByToken.forEach((info, token) => {
        const normalized = token.toUpperCase();
        if (normalized.includes("ORE") && !normalized.includes("WETH")) {
          rOREPrice = info.price;
        } else if (normalized.includes("WETH") || normalized.includes("ETH")) {
          wethPrice = info.price;
        }
      });
    }

    if (rOREPrice === null || wethPrice === null) {
      throw new Error("Could not find latest rORE or WETH prices in database");
    }

    // Format: rORE to 4 decimals, WETH to 2 decimals
    const currentPrice: CurrentPrice = {
      rORE: roundToDecimals(rOREPrice, 4),
      WETH: roundToDecimals(wethPrice, 2)
    };

    // 2. Fetch motherlodeTotal: latest motherlode_running from rounds
    const { data: latestRound, error: latestRoundError } = await client
      .from("rounds")
      .select("motherlode_running")
      .order("round_id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRoundError) {
      throw new Error(`Latest round query failed: ${latestRoundError.message}`);
    }

    const rawMotherlodeTotal = latestRound?.motherlode_running != null
      ? Number(latestRound.motherlode_running)
      : 0;
    const motherlodeTotal = roundToDecimals(rawMotherlodeTotal, 2);

    // 3. Fetch totalORELocked: sum of ore_amount from all rounds
    const { data: sumData, error: sumError } = await client
      .from("rounds")
      .select("ore_amount")
      .not("ore_amount", "is", null);

    if (sumError) {
      throw new Error(`Sum query failed: ${sumError.message}`);
    }

    const totalORELockedRaw = Array.isArray(sumData)
      ? sumData.reduce((sum, row) => sum + (Number(row.ore_amount) || 0), 0)
      : 0;
    const totalORELocked = roundToDecimals(totalORELockedRaw, 2);

    // 4. Fetch blockPerformance: for all blocks 1-25, count wins and percentage
    // First get total rounds count for percentage calculation
    const { count: totalRounds, error: countError } = await client
      .from("rounds")
      .select("*", { count: "exact", head: true });

    if (countError) {
      throw new Error(`Count query failed: ${countError.message}`);
    }

    const totalRoundsCount = totalRounds || 0;

    // Fetch block performance grouped by block_number (1-25)
    const { data: blockData, error: blockError } = await client
      .from("rounds")
      .select("block_number")
      .gte("block_number", 1)
      .lte("block_number", 25)
      .not("block_number", "is", null);

    if (blockError) {
      throw new Error(`Block performance query failed: ${blockError.message}`);
    }

    // Build blockPerformance array with all blocks 1-25
    const blockWins = new Map<number, number>();
    if (Array.isArray(blockData)) {
      for (const row of blockData) {
        const blockNum = Number(row.block_number);
        if (blockNum >= 1 && blockNum <= 25) {
          blockWins.set(blockNum, (blockWins.get(blockNum) || 0) + 1);
        }
      }
    }

    const blockPerformance: BlockPerformanceEntry[] = [];
    for (let block = 1; block <= 25; block++) {
      const wins = blockWins.get(block) || 0;
      const percentage = totalRoundsCount > 0 ? roundToDecimals((wins * 100) / totalRoundsCount, 1) : 0;
      blockPerformance.push({ block, wins, percentage });
    }

    // 5. Fetch winnerTypesDistribution: from last 1,044 rounds
    const { data: lastRounds, error: lastRoundsError } = await client
      .from("rounds")
      .select("winner_type")
      .order("round_id", { ascending: false })
      .limit(1044);

    if (lastRoundsError) {
      throw new Error(`Last rounds query failed: ${lastRoundsError.message}`);
    }

    let winnerTakeAllCount = 0;
    let splitCount = 0;

    if (Array.isArray(lastRounds)) {
      for (const row of lastRounds) {
        const winnerType = String(row.winner_type || "").toLowerCase();
        // Assuming winner_type values: "winner_take_all" or "split" (or similar)
        if (winnerType.includes("winner") || winnerType.includes("take_all") || winnerType === "wta") {
          winnerTakeAllCount++;
        } else {
          splitCount++;
        }
      }
    }

    const winnerTypesDistribution: WinnerTypesDistribution = {
      WINNER_TAKE_ALL: winnerTakeAllCount,
      SPLIT_EVENLY: splitCount
    };

    // 6. Fetch motherlodeHistory: ALL rounds with round_id and motherlode_running
    const { data: allRounds, error: allRoundsError } = await client
      .from("rounds")
      .select("round_id, motherlode_running")
      .order("round_id", { ascending: true });

    if (allRoundsError) {
      throw new Error(`All rounds query failed: ${allRoundsError.message}`);
    }

    const motherlodeHistory: MotherlodeHistoryEntry[] = Array.isArray(allRounds)
      ? allRounds.map(row => ({
          round_id: Number(row.round_id),
          motherlode_running: Number(row.motherlode_running)
        }))
      : [];

    // Assemble final object
    const result: DbStatsData = {
      currentPrice,
      motherlodeTotal,
      totalORELocked,
      blockPerformance,
      winnerTypesDistribution,
      motherlodeHistory
    };

    return result;
  } catch (error) {
    console.error(`[getDbStatsData] Error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export { getDbStatsData };
export default { getDbStatsData };
