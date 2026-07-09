"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriePonto } from "@/lib/saldo";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

type ProjectionChartProps = {
  serieProjetada: SeriePonto[];
  primeiroDiaNegativo?: string | null;
};

export default function ProjectionChart({
  serieProjetada,
  primeiroDiaNegativo,
}: ProjectionChartProps) {
  if (serieProjetada.length === 0) {
    return null;
  }

  return (
    <div data-testid="projection-chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={serieProjetada}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(value: number) => `R$ ${(value / 100).toFixed(0)}`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => String(label)}
          />
          <Line
            type="monotone"
            dataKey="saldo"
            stroke="#2563eb"
            dot={false}
            activeDot={{ r: 6 }}
          />
          {primeiroDiaNegativo && (
            <ReferenceLine
              x={primeiroDiaNegativo}
              stroke="#dc2626"
              label="1º dia negativo"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
