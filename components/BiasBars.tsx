"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function BiasBars({ counts }: { counts: { '-2': number; '-1': number; '0': number; '1': number; '2': number } }) {
  const data = [
    { lean: '-2', count: counts['-2'] },
    { lean: '-1', count: counts['-1'] },
    { lean: '0', count: counts['0'] },
    { lean: '1', count: counts['1'] },
    { lean: '2', count: counts['2'] },
  ];
  return (
    <div style={{ width: '100%', height: 160 }} aria-label="Bias Distribution">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="lean" />
          <YAxis allowDecimals={false} />
          <Bar dataKey="count" fill="#2563EB" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

