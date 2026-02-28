import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Camera,
  Loader2,
  LogOut,
  Moon,
  Save,
  Sun,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../../backend.d";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useSaveUserProfile,
  useSettings,
  useUpdateSettings,
} from "../../hooks/useQueries";

const PROFILE_PIC_KEY = "wbm-profile-pic";

interface SettingsPageProps {
  onBack: () => void;
  userProfile: UserProfile | null;
  isDark: boolean;
  onToggleDark: () => void;
}

export default function SettingsPage({
  onBack,
  userProfile,
  isDark,
  onToggleDark,
}: SettingsPageProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const saveProfile = useSaveUserProfile();

  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [profilePic, setProfilePic] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setOwnerName(settings.ownerName || userProfile?.name || "Wajeeha");
      setBusinessName(settings.businessName || "Wajeeha Business");
    } else if (userProfile) {
      setOwnerName(userProfile.name || "Wajeeha");
    }
    const saved = localStorage.getItem(PROFILE_PIC_KEY);
    if (saved) setProfilePic(saved);
  }, [settings, userProfile]);

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("تصویر 2MB سے چھوٹی ہونی چاہیے");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setProfilePic(result);
      localStorage.setItem(PROFILE_PIC_KEY, result);
      window.dispatchEvent(new Event("profilePicUpdated"));
      toast.success("Profile picture update ہو گئی!");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      await Promise.all([
        updateSettings.mutateAsync({
          ownerName,
          businessName,
          logoUrl: settings?.logoUrl ?? "",
        }),
        saveProfile.mutateAsync({ name: ownerName }),
      ]);
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    toast.success("Logged out successfully");
  };

  const isSaving = updateSettings.isPending || saveProfile.isPending;

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
            Settings
          </h1>
        </div>
      </div>

      <div className="px-4 py-4 content-with-bottom-nav max-w-lg mx-auto space-y-4">
        {/* Profile Section */}
        <div className="bg-card rounded-2xl p-4 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-card-lavender flex items-center justify-center">
              <User
                className="w-4 h-4"
                style={{ color: "oklch(0.45 0.18 285)" }}
              />
            </div>
            <h3 className="font-display font-semibold text-sm text-foreground">
              Profile
            </h3>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="h-20 bg-secondary animate-pulse rounded-xl" />
              <div className="h-11 bg-secondary animate-pulse rounded-xl" />
              <div className="h-11 bg-secondary animate-pulse rounded-xl" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Profile Picture */}
              <div className="flex flex-col items-center gap-2 pb-2">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-secondary flex items-center justify-center">
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow-sm border border-border"
                    style={{
                      background: "oklch(0.55 0.18 285)",
                      color: "white",
                    }}
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePicChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  تصویر تبدیل کریں (max 2MB)
                </p>
              </div>
              <div>
                <label
                  htmlFor="owner-name"
                  className="text-xs font-medium text-muted-foreground block mb-1.5"
                >
                  Owner Name
                </label>
                <input
                  id="owner-name"
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="business-name"
                  className="text-xs font-medium text-muted-foreground block mb-1.5"
                >
                  Business Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="business-name"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full h-11 pl-9 pr-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-11 rounded-xl font-display font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.55 0.18 285), oklch(0.5 0.16 255))",
                  color: "white",
                }}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>

        {/* Appearance */}
        <div className="bg-card rounded-2xl p-4 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-card-sky flex items-center justify-center">
              {isDark ? (
                <Moon
                  className="w-4 h-4"
                  style={{ color: "oklch(0.45 0.16 220)" }}
                />
              ) : (
                <Sun
                  className="w-4 h-4"
                  style={{ color: "oklch(0.45 0.16 220)" }}
                />
              )}
            </div>
            <h3 className="font-display font-semibold text-sm text-foreground">
              Appearance
            </h3>
          </div>

          <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              {isDark ? (
                <Moon
                  className="w-4.5 h-4.5 text-muted-foreground"
                  style={{ width: "18px", height: "18px" }}
                />
              ) : (
                <Sun
                  className="w-4.5 h-4.5 text-muted-foreground"
                  style={{ width: "18px", height: "18px" }}
                />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isDark ? "Dark Mode" : "Light Mode"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isDark ? "Switch to light theme" : "Switch to dark theme"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleDark}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${
                isDark ? "bg-primary" : "bg-border"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-all duration-300 ${
                  isDark ? "left-6.5 translate-x-0.5" : "left-0.5"
                }`}
                style={{ left: isDark ? "calc(100% - 22px)" : "2px" }}
              />
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-card rounded-2xl p-4 card-shadow">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="w-full h-11 rounded-xl font-display font-semibold text-sm flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 pb-4">
          <p className="text-xs text-muted-foreground">
            Wajeeha Business Manager v1.0
          </p>
          <p className="text-xs text-muted-foreground mt-1">
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
  );
}
