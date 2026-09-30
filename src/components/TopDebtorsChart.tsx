"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DebtorSlice } from "@/lib/utils";
import { useFormatMoney } from "@/lib/currency-context";

export default function TopDebtorsChart({ data }: { data: DebtorSlice[] }) {
  const formatMoney = useFormatMoney();
  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-gray-400">
        Aucun solde en cours.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="client"
            tickLine={false}
            axisLine={false}
            width={100}
            tick={{ fontSize: 12, fill: "#374151" }}
          />
          <Tooltip
            formatter={(value: number) => [formatMoney(value), "Solde dû"]}
            cursor={{ fill: "#f3f4f6" }}
            contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb", fontSize: 13 }}
          />
          <Bar dataKey="balance" fill="#f59e0b" radius={[0, 6, 6, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
