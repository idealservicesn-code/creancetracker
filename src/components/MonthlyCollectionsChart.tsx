"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useFormatMoney } from "@/lib/currency-context";

interface Props {
  data: { month: string; label: string; total: number }[];
}

export default function MonthlyCollectionsChart({ data }: Props) {
  const formatMoney = useFormatMoney();
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            width={70}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number) => [formatMoney(value), "Encaissé"]}
            cursor={{ fill: "#f3f4f6" }}
            contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb", fontSize: 13 }}
          />
          <Bar dataKey="total" fill="#2f8f72" radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
