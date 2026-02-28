import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CreditCard,
  DollarSign,
  Package,
  RefreshCw,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { UserProfile } from "../../backend.d";
import {
  useAllCustomers,
  useDashboardStats,
  useLowStockProducts,
} from "../../hooks/useQueries";

const PROFILE_PIC_KEY = "wbm-profile-pic";

interface DashboardPageProps {
  userProfile: UserProfile | null;
}

const statsConfig = [
  {
    key: "totalCustomers",
    label: "Total Customers",
    icon: Users,
    colorClass: "bg-card-lavender",
    iconClass: "stat-icon-lavender",
    format: (v: bigint | number) => String(v),
  },
  {
    key: "totalSalesAmount",
    label: "Total Sales",
    icon: TrendingUp,
    colorClass: "bg-card-sky",
    iconClass: "stat-icon-sky",
    format: (v: bigint | number) => `PKR ${Number(v).toLocaleString()}`,
  },
  {
    key: "totalProducts",
    label: "Total Products",
    icon: Package,
    colorClass: "bg-card-mint",
    iconClass: "stat-icon-mint",
    format: (v: bigint | number) => String(v),
  },
  {
    key: "todayRevenue",
    label: "Today's Revenue",
    icon: DollarSign,
    colorClass: "bg-card-peach",
    iconClass: "stat-icon-peach",
    format: (v: bigint | number) => `PKR ${Number(v).toLocaleString()}`,
  },
];

export default function DashboardPage({ userProfile }: DashboardPageProps) {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: lowStock, isLoading: lowStockLoading } = useLowStockProducts();
  const { data: customers, isLoading: customersLoading } = useAllCustomers();
  const [profilePic, setProfilePic] = useState<string>(
    () => localStorage.getItem(PROFILE_PIC_KEY) || "",
  );

  useEffect(() => {
    const handler = () =>
      setProfilePic(localStorage.getItem(PROFILE_PIC_KEY) || "");
    window.addEventListener("profilePicUpdated", handler);
    return () => window.removeEventListener("profilePicUpdated", handler);
  }, []);

  const dueCustomers = customers?.filter((c) => c.dueAmount > 0) ?? [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  };

  const getStatValue = (key: string) => {
    if (!stats) return 0;
    return ((stats as Record<string, unknown>)[key] as bigint | number) ?? 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="bg-card border-b border-border px-4 pb-4"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-border bg-secondary flex items-center justify-center shadow-xs flex-shrink-0">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Good day,
              </p>
              <h1 className="font-display text-lg font-bold text-foreground leading-tight">
                {userProfile?.name || "Wajeeha"} 👋
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="px-4 py-4 content-with-bottom-nav max-w-lg mx-auto space-y-5">
        {/* Stats Grid */}
        <div>
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {statsConfig.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                  className={`${stat.colorClass} rounded-2xl p-4 card-shadow`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.iconClass}`}
                  >
                    <Icon
                      className="w-4.5 h-4.5"
                      style={{ width: "18px", height: "18px" }}
                    />
                  </div>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-20 mb-1 rounded-lg" />
                  ) : (
                    <p className="font-display text-xl font-bold text-foreground">
                      {stat.format(getStatValue(stat.key))}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    {stat.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4 }}
          className="bg-card rounded-2xl p-4 card-shadow"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="font-display font-semibold text-sm text-foreground">
              Low Stock Alert
            </h3>
            {!lowStockLoading && lowStock && lowStock.length > 0 && (
              <span className="ml-auto text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                {lowStock.length} items
              </span>
            )}
          </div>

          {lowStockLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-10 rounded-xl" />
              ))}
            </div>
          ) : lowStock && lowStock.length > 0 ? (
            <div className="space-y-2">
              {lowStock.slice(0, 5).map((product) => (
                <div
                  key={String(product.id)}
                  className="flex items-center justify-between bg-red-50 dark:bg-red-900/10 rounded-xl px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Package className="w-4 h-4 text-red-400" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                      {product.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-red-500 bg-white dark:bg-red-900/20 px-2 py-1 rounded-lg">
                    {Number(product.quantity)} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-sm text-muted-foreground">
                ✅ All products well-stocked
              </p>
            </div>
          )}
        </motion.div>

        {/* Due Payment Reminders */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4 }}
          className="bg-card rounded-2xl p-4 card-shadow"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="font-display font-semibold text-sm text-foreground">
              Due Payments
            </h3>
            {!customersLoading && dueCustomers.length > 0 && (
              <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                {dueCustomers.length} pending
              </span>
            )}
          </div>

          {customersLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-10 rounded-xl" />
              ))}
            </div>
          ) : dueCustomers.length > 0 ? (
            <div className="space-y-2">
              {dueCustomers.slice(0, 5).map((customer) => (
                <div
                  key={String(customer.id)}
                  className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/10 rounded-xl px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {customer.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {customer.phone}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-white dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                    PKR {customer.dueAmount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-sm text-muted-foreground">
                ✅ No pending payments
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
