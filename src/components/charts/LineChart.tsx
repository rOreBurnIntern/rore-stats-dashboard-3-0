'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface LineChartProps {
  data: Array<{ timestamp: number; motherlode: number }>;
}

export function MotherlodeLineChart({ data }: LineChartProps) {
  const formattedData = data.map(d => ({
    ...d,
    date: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            interval={Math.max(0, Math.floor(data.length / 6))}
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => Number(v).toFixed(1)}
          />
          <Tooltip 
            formatter={(value) => [`${Number(value).toFixed(2)} rORE`, 'Motherlode']}
          />
          <Line 
            type="monotone" 
            dataKey="motherlode" 
            stroke="#f97316" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
