"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { StatusSlice } from "@/lib/utils";

export default function StatusPieChart({
  data,
  unitLabel = "",
  emptyLabel = "Aucune donnée pour le moment.",
}: {
  data: StatusSlice[];
  unitLabel?: string;
  emptyLabel?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-gray-400">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius={48}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((slice) => (
              <Cell key={slice.status} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value} ${unitLabel}`.trim(), name]}
            contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb", fontSize: 13 }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
