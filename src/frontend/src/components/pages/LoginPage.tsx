import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } catch (error: unknown) {
      console.error("Login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loading = isLoggingIn || loginStatus === "logging-in";

  return (
    <div className="min-h-screen login-gradient relative overflow-hidden flex flex-col items-center justify-center px-6">
      {/* Animated orbs */}
      <div
        className="orb orb-1 w-64 h-64 -top-16 -left-16"
        style={{ backgroundColor: "oklch(0.82 0.12 285 / 0.5)" }}
      />
      <div
        className="orb orb-2 w-80 h-80 -bottom-24 -right-20"
        style={{ backgroundColor: "oklch(0.85 0.1 220 / 0.45)" }}
      />
      <div
        className="orb orb-3 w-56 h-56 top-1/3 right-8"
        style={{ backgroundColor: "oklch(0.88 0.09 160 / 0.35)" }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-20 h-20 mb-4 rounded-3xl overflow-hidden shadow-float bg-white/60 backdrop-blur-sm flex items-center justify-center p-2"
          >
            <img
              src="/assets/generated/wajeeha-logo-transparent.dim_200x200.png"
              alt="Wajeeha Business Manager"
              className="w-full h-full object-contain"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center"
          >
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              Wajeeha Business
            </h1>
            <p className="font-display text-base font-semibold text-foreground/70 mt-0.5">
              Manager
            </p>
          </motion.div>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-float border border-white/60 dark:border-border"
        >
          <div className="text-center mb-6">
            <h2 className="font-display text-xl font-bold text-foreground">
              Welcome Back
            </h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              Sign in to manage your business
            </p>
          </div>

          {/* Features list */}
          <div className="space-y-3 mb-8">
            {[
              { emoji: "📦", text: "Manage products & inventory" },
              { emoji: "👥", text: "Track customers & payments" },
              { emoji: "🧾", text: "Create & share invoices" },
              { emoji: "📊", text: "View sales reports" },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                className="flex items-center gap-3 bg-secondary/50 rounded-xl px-3 py-2.5"
              >
                <span className="text-base">{item.emoji}</span>
                <span className="text-sm text-foreground/80 font-medium">
                  {item.text}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Login Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-13 rounded-2xl font-display font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-float disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: loading
                ? "oklch(0.75 0.1 285)"
                : "linear-gradient(135deg, oklch(0.55 0.18 285), oklch(0.5 0.16 255))",
              color: "white",
              height: "52px",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>🔐</span>
                <span>Sign In Securely</span>
              </>
            )}
          </motion.button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Powered by Internet Identity — secure & private
          </p>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-foreground/50 mt-6">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
