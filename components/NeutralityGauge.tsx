"use client";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function NeutralityGauge({ score }: { score: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  const data = [
    { name: 'Neutral', value: safe },
    { name: 'Gap', value: 100 - safe },
  ];
  const COLORS = ['#16a34a', '#e2e8f0'];
  return (
    <div style={{ width: '100%', height: 120 }} aria-label="Neutrality Gauge">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={38}
            outerRadius={58}
            startAngle={180}
            endAngle={0}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center text-xs mt-[-22px] font-semibold">{safe}</div>
    </div>
  );
}

