import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Expense } from "../../backend.d";
import {
  useAllExpenses,
  useCreateExpense,
  useDeleteExpense,
} from "../../hooks/useQueries";

interface ExpensesPageProps {
  onBack: () => void;
}

const CATEGORIES = [
  { label: "Food", emoji: "🍔", color: "bg-orange-50 text-orange-600" },
  { label: "Transport", emoji: "🚗", color: "bg-blue-50 text-blue-600" },
  { label: "Utilities", emoji: "💡", color: "bg-yellow-50 text-yellow-600" },
  { label: "Salaries", emoji: "💼", color: "bg-purple-50 text-purple-600" },
  { label: "Rent", emoji: "🏠", color: "bg-indigo-50 text-indigo-600" },
  { label: "Marketing", emoji: "📣", color: "bg-pink-50 text-pink-600" },
  { label: "Other", emoji: "📦", color: "bg-gray-100 text-gray-600" },
];

function getCategoryStyle(category: string) {
  return (
    CATEGORIES.find((c) => c.label === category) ?? {
      label: category,
      emoji: "💰",
      color: "bg-gray-100 text-gray-600",
    }
  );
}

export default function ExpensesPage({ onBack }: ExpensesPageProps) {
  const { data: expenses, isLoading } = useAllExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    category: "Other",
    description: "",
  });

  // Group expenses by month
  const groupedExpenses = (expenses ?? []).reduce<Record<string, Expense[]>>(
    (acc, expense) => {
      const date = new Date(Number(expense.date) / 1_000_000);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(expense);
      return acc;
    },
    {},
  );

  const sortedMonths = Object.keys(groupedExpenses).sort().reverse();

  // Category totals
  const categoryTotals = (expenses ?? []).reduce<Record<string, number>>(
    (acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    },
    {},
  );

  const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseFloat(formData.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      await createExpense.mutateAsync({
        amount,
        category: formData.category,
        description: formData.description,
      });
      toast.success("Expense added!");
      setShowModal(false);
      setFormData({ amount: "", category: "Other", description: "" });
    } catch {
      toast.error("Failed to add expense");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteExpense.mutateAsync(deleteId);
      toast.success("Expense deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  const maxCategoryAmount = Math.max(...Object.values(categoryTotals), 1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="bg-card border-b border-border px-4 pb-3"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-display text-xl font-bold text-foreground">
              Expenses
            </h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="h-9 px-4 rounded-xl font-display font-semibold text-sm flex items-center gap-1.5 text-white"
            style={{ background: "oklch(0.55 0.18 285)" }}
          >
            <Plus className="w-4 h-4" />
            Add
          </motion.button>
        </div>
      </div>

      <div className="px-4 py-4 content-with-bottom-nav max-w-lg mx-auto space-y-4">
        {/* Total Summary */}
        <div
          className="rounded-2xl p-4 text-white"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.55 0.18 285), oklch(0.5 0.16 255))",
          }}
        >
          <p className="text-sm text-white/70">Total Expenses</p>
          <p className="font-display text-3xl font-bold mt-1">
            PKR {totalExpenses.toLocaleString()}
          </p>
          <p className="text-xs text-white/60 mt-1">
            {(expenses ?? []).length} transactions
          </p>
        </div>

        {/* Category Breakdown */}
        {Object.keys(categoryTotals).length > 0 && (
          <div className="bg-card rounded-2xl p-4 card-shadow">
            <h3 className="font-display font-semibold text-sm text-foreground mb-3">
              By Category
            </h3>
            <div className="space-y-3">
              {Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const style = getCategoryStyle(category);
                  const pct = (amount / maxCategoryAmount) * 100;
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{style.emoji}</span>
                          <span className="text-sm font-medium text-foreground">
                            {category}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-foreground">
                          PKR {amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: "oklch(0.55 0.18 285)" }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Expense List by Month */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : expenses && expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-3">
              <Wallet className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-display font-semibold text-foreground">
              No expenses yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap "Add" to record an expense
            </p>
          </div>
        ) : (
          sortedMonths.map((monthKey) => {
            const monthExpenses = groupedExpenses[monthKey];
            const [year, month] = monthKey.split("-");
            const monthLabel = new Date(
              Number.parseInt(year),
              Number.parseInt(month) - 1,
            ).toLocaleDateString("en-PK", { month: "long", year: "numeric" });
            const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

            return (
              <div key={monthKey}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-sm font-semibold text-muted-foreground">
                    {monthLabel}
                  </h3>
                  <span className="text-xs font-bold text-foreground">
                    PKR {monthTotal.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-2">
                  {monthExpenses.map((expense, i) => {
                    const style = getCategoryStyle(expense.category);
                    return (
                      <motion.div
                        key={String(expense.id)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-card rounded-2xl px-4 py-3 card-shadow flex items-center gap-3"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${style.color}`}
                        >
                          {style.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {expense.description || expense.category}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {expense.category} ·{" "}
                            {new Date(
                              Number(expense.date) / 1_000_000,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-sm text-foreground">
                            PKR {expense.amount.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDeleteId(expense.id)}
                            className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ y: 48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 48, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.2 }}
              className="bg-card rounded-3xl p-6 w-full max-w-md shadow-float"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Add Expense
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="expense-amount"
                    className="text-xs font-medium text-muted-foreground block mb-1.5"
                  >
                    Amount (PKR) *
                  </label>
                  <input
                    id="expense-amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, amount: e.target.value }))
                    }
                    placeholder="0"
                    min="1"
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="expense-category"
                    className="text-xs font-medium text-muted-foreground block mb-1.5"
                  >
                    Category *
                  </label>
                  <div className="relative">
                    <select
                      id="expense-category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, category: e.target.value }))
                      }
                      className="w-full h-11 px-3.5 pr-8 rounded-xl border border-border bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.label} value={cat.label}>
                          {cat.emoji} {cat.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="expense-desc"
                    className="text-xs font-medium text-muted-foreground block mb-1.5"
                  >
                    Description
                  </label>
                  <input
                    id="expense-desc"
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="What was this expense for?"
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-11 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createExpense.isPending}
                    className="flex-1 h-11 rounded-xl font-display font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.55 0.18 285), oklch(0.5 0.16 255))",
                      color: "white",
                    }}
                  >
                    {createExpense.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Add Expense"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent className="rounded-3xl mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground"
              disabled={deleteExpense.isPending}
            >
              {deleteExpense.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
