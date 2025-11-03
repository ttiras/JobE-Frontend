/**
 * Factor Contribution Chart Component
 * 
 * Displays a pie chart showing the contribution of each factor to the final score
 */

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface FactorChartProps {
  factors: Array<{
    factor_name: string;
    weighted_points: number;
  }>;
}

export function FactorContributionChart({ factors }: FactorChartProps) {
  const data = factors.map(f => ({
    name: f.factor_name,
    value: parseFloat(f.weighted_points.toFixed(2))
  }));
  
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
