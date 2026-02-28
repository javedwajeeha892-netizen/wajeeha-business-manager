import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveUserProfile } from "../../hooks/useQueries";

interface ProfileSetupPageProps {
  onComplete: () => void;
}

export default function ProfileSetupPage({
  onComplete,
}: ProfileSetupPageProps) {
  const [name, setName] = useState("Wajeeha");
  const saveProfile = useSaveUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      toast.success("Profile created!");
      onComplete();
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen login-gradient flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-float border border-white/60 dark:border-border"
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">👋</div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome!
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            What should we call you?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="profile-name"
              className="text-sm font-medium text-foreground/80 block mb-2"
            >
              Your Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-base"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!name.trim() || saveProfile.isPending}
            className="w-full h-12 rounded-2xl font-display font-bold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.18 285), oklch(0.5 0.16 255))",
              color: "white",
            }}
          >
            {saveProfile.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Get Started →"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
