export interface Round {
  id: string;
  roundId: string;
  block: string;
  winnerTakeAll: boolean;
  oreWinner: string;
  motherlode: string;
  motherlodeHit: boolean;
  endTimestamp: number;
}

export interface ProtocolStats {
  wethPrice: string;
  rorePrice: string;
  motherlode: string;
  lastUpdate: string;
}

export interface StatsPayload {
  prices: ProtocolStats;
  rounds: Round[];
  pie: {
    winnerTakeAll: number;
    split: number;
  };
  bar: Array<{ block: number; wins: number }>;
  line: Array<{ timestamp: number; motherlode: number }>;
  source: 'upstream' | 'supabase';
  lastUpdate: string;
}

export interface ApiResponse {
  success: boolean;
  data?: StatsPayload;
  error?: string;
}
