import { getDbStatsData } from '@/app/lib/db-stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getDbStatsData();

  if (!data) {
    return Response.json(
      { error: 'Failed to load stats data' },
      { status: 500 }
    );
  }

  return Response.json(data);
}
