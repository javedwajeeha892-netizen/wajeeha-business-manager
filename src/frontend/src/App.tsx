import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import CustomersPage from "./components/pages/CustomersPage";
import DashboardPage from "./components/pages/DashboardPage";
import ExpensesPage from "./components/pages/ExpensesPage";
import InvoicesPage from "./components/pages/InvoicesPage";
import LoginPage from "./components/pages/LoginPage";
import MorePage from "./components/pages/MorePage";
import ProductsPage from "./components/pages/ProductsPage";
import ProfileSetupPage from "./components/pages/ProfileSetupPage";
import ReportsPage from "./components/pages/ReportsPage";
import SettingsPage from "./components/pages/SettingsPage";
import BottomNav, { type TabType } from "./components/shared/BottomNav";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";

type SubScreen = "expenses" | "reports" | "settings" | null;

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const [isDark, setIsDark] = useState(false);

  const isAuthenticated = !!identity;
  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  // Apply dark mode class
  useEffect(() => {
    const saved = localStorage.getItem("wbm-theme");
    if (saved === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("wbm-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("wbm-theme", "light");
    }
  };

  const handleTabChange = (tab: TabType) => {
    setSubScreen(null);
    setActiveTab(tab);
  };

  const handleMoreNavigate = (screen: "expenses" | "reports" | "settings") => {
    setSubScreen(screen);
  };

  // Loading state while checking auth
  if (isInitializing || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-screen login-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-float">
            <img
              src="/assets/generated/wajeeha-logo-transparent.dim_200x200.png"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: "oklch(0.55 0.18 285)" }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  // Profile setup
  if (showProfileSetup) {
    return (
      <>
        <ProfileSetupPage onComplete={() => {}} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  // Sub-screens from More tab
  if (subScreen) {
    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key={subScreen}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.25 }}
          >
            {subScreen === "expenses" && (
              <ExpensesPage onBack={() => setSubScreen(null)} />
            )}
            {subScreen === "reports" && (
              <ReportsPage onBack={() => setSubScreen(null)} />
            )}
            {subScreen === "settings" && (
              <SettingsPage
                onBack={() => setSubScreen(null)}
                userProfile={userProfile ?? null}
                isDark={isDark}
                onToggleDark={toggleDark}
              />
            )}
          </motion.div>
        </AnimatePresence>
        {/* Bottom nav still visible for sub-screens */}
        <BottomNav active="more" onChange={handleTabChange} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  // Main app
  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "dashboard" && (
            <DashboardPage userProfile={userProfile ?? null} />
          )}
          {activeTab === "products" && <ProductsPage />}
          {activeTab === "customers" && <CustomersPage />}
          {activeTab === "invoices" && <InvoicesPage />}
          {activeTab === "more" && (
            <MorePage
              userProfile={userProfile ?? null}
              onNavigate={handleMoreNavigate}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <BottomNav active={activeTab} onChange={handleTabChange} />
      <Toaster position="top-center" richColors />
    </>
  );
}
