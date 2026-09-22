import { useState } from "react";
import { updateApiKeyModel } from "../api/auth";
import { AI_MODELS } from "../constants/models";
import { useAuth } from "../hooks/useAuth";
import { useSettings } from "../hooks/useSettings";
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Key,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { apiKey, setApiKey, modelName, setModelName, isLoggedIn } =
    useSettings();
  const [tab, setTab] = useState(isLoggedIn ? "config" : "auth");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const { loading, message, setMessage, signIn, signUp, signOut } = useAuth();
  const [saveLoading, setSaveLoading] = useState(false);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();

    if (authMode === "signup") {
      const success = await signUp({
        email,
        password,
        username: username || email.split("@")[0],
      });

      if (success) {
        setAuthMode("signin");
      }

      return;
    }

    const success = await signIn({ email, password });

    if (success) {
      setTab("config");
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSaveLoading(true);
    setMessage("");

    try {
      if (isLoggedIn) {
        await updateApiKeyModel({
          api_key: apiKey.trim(),
          model_name: modelName.trim(),
        });
      }

      setMessage("Settings saved successfully!");

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setSaveLoading(false);
    }
  }

  const isErrorMessage =
    message.toLowerCase().includes("failed") ||
    message.toLowerCase().includes("error") ||
    message.toLowerCase().includes("no active account") ||
    message.toLowerCase().includes("unauthorized");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="
          w-[calc(100%-1rem)]
          min-w-0
          max-w-md
          sm:w-full
          max-h-[90vh]
          overflow-y-auto
          p-4
          sm:p-6
          bg-card
          border-border
          rounded-xl
          sm:rounded-2xl
        "
      >
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-primary" />
            <span>Account & Configuration</span>
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            Manage your credentials, authentication, and AI provider keys.
          </DialogDescription>
        </DialogHeader>

        {message && (
          <div
            role="status"
            className={`flex items-start gap-2 rounded-lg border p-3 text-xs sm:text-sm font-medium leading-relaxed ${
              isErrorMessage
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-emerald-800/50 bg-emerald-950/40 text-emerald-400"
            }`}
          >
            {isErrorMessage ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}

            <span className="min-w-0 break-words">{message}</span>
          </div>
        )}

        <Tabs
          value={tab}
          onValueChange={setTab}
          className="flex w-full min-w-0 flex-col"
        >
          <TabsList className="grid h-auto w-full min-w-0 shrink-0 grid-cols-2 gap-1 rounded-lg bg-secondary/80 p-1 border border-border/60">
            <TabsTrigger
              value="auth"
              className="min-w-0 px-2 py-2 text-xs sm:text-sm"
            >
              <span className="truncate">
                {isLoggedIn ? "Account Status" : "Authentication"}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="config"
              className="min-w-0 px-2 py-2 text-xs sm:text-sm"
            >
              <span className="truncate">AI & API Keys</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auth" className="mt-0 w-full min-w-0 pt-4">
            {isLoggedIn ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-secondary/40 p-4 sm:p-5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">
                    Connected & Signed In
                  </h3>

                  <p className="mx-auto max-w-xs text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    Your API keys and session preferences will sync across your
                    workspaces automatically.
                  </p>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-1 w-full gap-2"
                  onClick={signOut}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleAuth}
                className="flex flex-col gap-4"
                noValidate={false}
              >
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/60 bg-secondary/60 p-1">
                  <button
                    type="button"
                    aria-pressed={authMode === "signin"}
                    className={`min-h-9 rounded-md px-2 text-xs sm:text-sm font-medium transition-colors ${
                      authMode === "signin"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                    }`}
                    onClick={() => setAuthMode("signin")}
                  >
                    Sign In
                  </button>

                  <button
                    type="button"
                    aria-pressed={authMode === "signup"}
                    className={`min-h-9 rounded-md px-2 text-xs sm:text-sm font-medium transition-colors ${
                      authMode === "signup"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                    }`}
                    onClick={() => setAuthMode("signup")}
                  >
                    Sign Up
                  </button>
                </div>

                {authMode === "signup" && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="auth-username"
                      className="text-xs sm:text-sm font-medium text-muted-foreground"
                    >
                      Username
                    </Label>

                    <Input
                      id="auth-username"
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-9 sm:h-10 w-full text-sm bg-background/50 border-border"
                      autoComplete="username"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label
                    htmlFor="auth-email"
                    className="text-xs sm:text-sm font-medium text-muted-foreground"
                  >
                    Email Address
                  </Label>

                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 sm:h-10 w-full text-sm bg-background/50 border-border"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="auth-password"
                    className="text-xs sm:text-sm font-medium text-muted-foreground"
                  >
                    Password
                  </Label>

                  <Input
                    id="auth-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-9 sm:h-10 w-full text-sm bg-background/50 border-border"
                    autoComplete={
                      authMode === "signin"
                        ? "current-password"
                        : "new-password"
                    }
                  />
                </div>

                <Button
                  variant="default"
                  type="submit"
                  className="mt-1 h-10 w-full text-sm font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      <span>Processing...</span>
                    </>
                  ) : authMode === "signin" ? (
                    "Sign In to Account"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            )}
          </TabsContent>

          <TabsContent value="config" className="mt-0 w-full min-w-0 pt-4">
            <form onSubmit={handleSaveConfig} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="cfg-key"
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground"
                >
                  <Key className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>API Key</span>
                </Label>

                <Input
                  id="cfg-key"
                  type="password"
                  className="h-9 sm:h-10 w-full text-sm font-mono bg-background/50 border-border"
                  placeholder="AIzaSy... / sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoComplete="off"
                />

                <p className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground/70">
                  Universal key used for Gemini, OpenAI, Claude, DeepSeek, or
                  Groq.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="cfg-model"
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground"
                >
                  <Cpu className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>Default AI Model</span>
                </Label>

                <Select value={modelName} onValueChange={setModelName}>
                  <SelectTrigger
                    id="cfg-model"
                    className="h-9 sm:h-10 w-full text-sm font-mono bg-background/50 border-border"
                  >
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>

                  <SelectContent className="max-h-60">
                    {AI_MODELS.map((m) => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                        className="text-xs sm:text-sm font-mono"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-sans text-muted-foreground">
                            {m.provider}
                          </span>
                          <span className="truncate">{m.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="default"
                type="submit"
                className="mt-1 h-10 w-full text-sm font-semibold"
                disabled={saveLoading}
              >
                {saveLoading ? "Saving Configuration..." : "Save Configuration"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
