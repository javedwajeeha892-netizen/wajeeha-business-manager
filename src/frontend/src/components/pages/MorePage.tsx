import { BarChart2, ChevronRight, Settings, User, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { UserProfile } from "../../backend.d";

const PROFILE_PIC_KEY = "wbm-profile-pic";

interface MorePageProps {
  userProfile: UserProfile | null;
  onNavigate: (screen: "expenses" | "reports" | "settings") => void;
}

const menuItems = [
  {
    id: "expenses" as const,
    label: "Expenses",
    description: "Track daily expenses & reports",
    icon: Wallet,
    emoji: "💸",
    colorClass: "bg-card-peach",
    iconColor: "text-amber-500",
  },
  {
    id: "reports" as const,
    label: "Reports",
    description: "Weekly, monthly & profit/loss",
    icon: BarChart2,
    emoji: "📊",
    colorClass: "bg-card-sky",
    iconColor: "text-blue-500",
  },
  {
    id: "settings" as const,
    label: "Settings",
    description: "Profile, theme & preferences",
    icon: Settings,
    emoji: "⚙️",
    colorClass: "bg-card-lavender",
    iconColor: "text-purple-500",
  },
];

export default function MorePage({ userProfile, onNavigate }: MorePageProps) {
  const [profilePic, setProfilePic] = useState<string>(
    () => localStorage.getItem(PROFILE_PIC_KEY) || "",
  );

  useEffect(() => {
    const handler = () =>
      setProfilePic(localStorage.getItem(PROFILE_PIC_KEY) || "");
    window.addEventListener("profilePicUpdated", handler);
    return () => window.removeEventListener("profilePicUpdated", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="bg-card border-b border-border px-4 pb-4"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border bg-secondary flex items-center justify-center flex-shrink-0">
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
            <h1 className="font-display text-xl font-bold text-foreground leading-tight">
              {userProfile?.name || "Wajeeha"}
            </h1>
            <p className="text-xs text-muted-foreground">Business Manager</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 content-with-bottom-nav max-w-lg mx-auto space-y-3">
        {menuItems.map((item, i) => {
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate(item.id)}
              className="w-full bg-card rounded-2xl p-4 card-shadow flex items-center gap-4 text-left"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${item.colorClass} flex items-center justify-center text-2xl flex-shrink-0`}
              >
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-base text-foreground">
                  {item.label}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {item.description}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </motion.button>
          );
        })}

        {/* App Info */}
        <div className="bg-card rounded-2xl p-4 card-shadow mt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img
                src="/assets/generated/wajeeha-logo-transparent.dim_200x200.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-foreground">
                Wajeeha Business Manager
              </p>
              <p className="text-xs text-muted-foreground">Version 1.0</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()}.{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Built with ♥ using caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
