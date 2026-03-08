'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: Array<{ timestamp: number; motherlode: number }>;
}

export function LineChartComponent({ data }: Props) {
  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(data.length / 5)} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v.toFixed(1)} />
          <Tooltip formatter={(v: number) => [`${v.toFixed(2)} rORE`, 'Motherlode']} />
          <Line type="monotone" dataKey="motherlode" stroke="#f97316" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
