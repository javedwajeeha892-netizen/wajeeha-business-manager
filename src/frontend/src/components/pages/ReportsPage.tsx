import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAllSales, useProfitLoss } from "../../hooks/useQueries";

interface ReportsPageProps {
  onBack: () => void;
}

export default function ReportsPage({ onBack }: ReportsPageProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: profitLoss, isLoading } = useProfitLoss(month, year);
  const { data: sales } = useAllSales();

  const monthLabel = new Date(year, month - 1).toLocaleDateString("en-PK", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    const now = new Date();
    if (
      year > now.getFullYear() ||
      (year === now.getFullYear() && month >= now.getMonth() + 1)
    ) {
      return;
    }
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // Weekly data for the selected month
  const monthlySales = (sales ?? []).filter((s) => {
    const d = new Date(Number(s.date) / 1_000_000);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const weeklyData = [
    { week: "Week 1", amount: 0 },
    { week: "Week 2", amount: 0 },
    { week: "Week 3", amount: 0 },
    { week: "Week 4", amount: 0 },
  ];

  for (const sale of monthlySales) {
    const d = new Date(Number(sale.date) / 1_000_000);
    const weekIndex = Math.min(Math.floor((d.getDate() - 1) / 7), 3);
    weeklyData[weekIndex].amount += sale.amount;
  }

  const profit = profitLoss?.profit ?? 0;
  const isProfit = profit >= 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="bg-card border-b border-border px-4 pb-3"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-display text-xl font-bold text-foreground">
            Reports
          </h1>
        </div>
      </div>

      <div className="px-4 py-4 content-with-bottom-nav max-w-lg mx-auto space-y-4">
        {/* Month Picker */}
        <div className="bg-card rounded-2xl p-3 card-shadow flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-display font-semibold text-foreground">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Profit/Loss Summary */}
        {isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : (
          <motion.div
            key={`${month}-${year}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-5 card-shadow"
          >
            <h3 className="font-display font-semibold text-sm text-muted-foreground mb-4">
              Profit & Loss Summary
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-card-sky rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Sales</p>
                <p className="font-display font-bold text-sm text-foreground">
                  {(profitLoss?.sales ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-card-peach rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Expenses</p>
                <p className="font-display font-bold text-sm text-foreground">
                  {(profitLoss?.expenses ?? 0).toLocaleString()}
                </p>
              </div>
              <div
                className={`rounded-xl p-3 text-center ${
                  isProfit ? "bg-card-mint" : "bg-red-50 dark:bg-red-900/20"
                }`}
              >
                <p className="text-xs text-muted-foreground mb-1">Net</p>
                <p
                  className={`font-display font-bold text-sm ${
                    isProfit
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600"
                  }`}
                >
                  {Math.abs(profit).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Big P&L Card */}
            <div
              className={`rounded-xl p-4 flex items-center justify-between ${
                isProfit
                  ? "bg-green-50 dark:bg-green-900/20"
                  : profit === 0
                    ? "bg-secondary"
                    : "bg-red-50 dark:bg-red-900/20"
              }`}
            >
              <div>
                <p className="text-xs text-muted-foreground">
                  {isProfit
                    ? "Net Profit"
                    : profit === 0
                      ? "Break Even"
                      : "Net Loss"}
                </p>
                <p
                  className={`font-display text-2xl font-bold mt-0.5 ${
                    isProfit
                      ? "text-green-600 dark:text-green-400"
                      : profit === 0
                        ? "text-foreground"
                        : "text-red-600"
                  }`}
                >
                  {profit < 0 ? "-" : ""}PKR {Math.abs(profit).toLocaleString()}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isProfit
                    ? "bg-green-100"
                    : profit === 0
                      ? "bg-secondary"
                      : "bg-red-100"
                }`}
              >
                {isProfit ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : profit === 0 ? (
                  <Minus className="w-6 h-6 text-muted-foreground" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Weekly Sales Chart */}
        <div className="bg-card rounded-2xl p-4 card-shadow">
          <h3 className="font-display font-semibold text-sm text-foreground mb-4">
            Weekly Sales
          </h3>
          {monthlySales.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No sales data for this month
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={weeklyData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.88 0.04 285)"
                />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "oklch(0.52 0.05 275)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.52 0.05 275)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip
                  formatter={(value: number) => [
                    `PKR ${value.toLocaleString()}`,
                    "Sales",
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(100,80,160,0.15)",
                    fontFamily: "Figtree, sans-serif",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="amount"
                  fill="oklch(0.55 0.18 285)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
