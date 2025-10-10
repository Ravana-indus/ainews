"use client";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function BiasRadar({ values }: { values: { sentiment: number; frame: number; omission: number; diversity: number } }) {
  const data = [
    { metric: 'Sentiment', value: values.sentiment },
    { metric: 'Frame', value: values.frame },
    { metric: 'Omission', value: values.omission },
    { metric: 'Diversity', value: values.diversity },
  ];
  return (
    <div style={{ width: '100%', height: 240 }} aria-label="Bias Radar">
      <ResponsiveContainer>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis angle={45} domain={[0, 100]} />
          <Radar name="Bias" dataKey="value" stroke="#2563EB" fill="#2563EB" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

