import { useState } from "react";
import { updateApiKeyModel } from "../api/auth";
import { AI_MODELS } from "../constants/models";
import { useAuth } from "../hooks/useAuth";
import { useSettings } from "../hooks/useSettings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  CheckCircle2,
  LogOut,
  Key,
  Cpu,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [tab, setTab] = useState<string>("auth");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const { apiKey, setApiKey, modelName, setModelName, isLoggedIn } = useSettings();
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
      if (success) setAuthMode("signin");
    } else {
      const success = await signIn({ email, password });
      if (success) setTab("config");
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
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Account & Configuration</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Manage your credentials, authentication, and AI provider keys.
          </DialogDescription>
        </DialogHeader>

        {/* Status Message */}
        {message && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 font-medium ${
              isErrorMessage
                ? "bg-destructive/15 border border-destructive/30 text-destructive"
                : "bg-emerald-950/40 border border-emerald-800/50 text-emerald-400"
            }`}
          >
            {isErrorMessage ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-secondary/80 p-1 border border-border/60">
            <TabsTrigger value="auth" className="text-xs">
              {isLoggedIn ? "Account Status" : "Authentication"}
            </TabsTrigger>
            <TabsTrigger value="config" className="text-xs">
              AI & API Keys
            </TabsTrigger>
          </TabsList>

          {/* Authentication Tab */}
          <TabsContent value="auth" className="pt-3">
            {isLoggedIn ? (
              <div className="flex flex-col items-center py-5 text-center gap-3 bg-secondary/40 rounded-xl border border-border/60 p-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    Connected & Signed In
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    Your API keys and session preferences will sync across your workspaces automatically.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full mt-2 text-xs gap-2"
                  onClick={signOut}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary/60 rounded-lg border border-border/60">
                  <button
                    type="button"
                    className={`py-1 text-xs font-medium rounded-md transition-colors ${
                      authMode === "signin"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setAuthMode("signin")}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className={`py-1 text-xs font-medium rounded-md transition-colors ${
                      authMode === "signup"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setAuthMode("signup")}
                  >
                    Sign Up
                  </button>
                </div>

                {authMode === "signup" && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="auth-username" className="text-xs font-medium text-muted-foreground">
                      Username
                    </Label>
                    <Input
                      id="auth-username"
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-8 text-xs bg-background/50 border-border"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="auth-email" className="text-xs font-medium text-muted-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-8 text-xs bg-background/50 border-border"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="auth-password" className="text-xs font-medium text-muted-foreground">
                    Password
                  </Label>
                  <Input
                    id="auth-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-8 text-xs bg-background/50 border-border"
                  />
                </div>

                <Button
                  variant="default"
                  type="submit"
                  className="w-full mt-2 h-9 text-xs font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-1" />
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

          {/* Config Tab */}
          <TabsContent value="config" className="pt-3">
            <form onSubmit={handleSaveConfig} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cfg-key" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-primary" />
                  <span>API Key</span>
                </Label>
                <Input
                  id="cfg-key"
                  type="password"
                  className="h-8 text-xs font-mono bg-background/50 border-border"
                  placeholder="AIzaSy... / sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <span className="text-[11px] text-muted-foreground/70">
                  Universal key used for Gemini, OpenAI, Claude, DeepSeek, or Groq.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cfg-model" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-primary" />
                  <span>Default AI Model</span>
                </Label>
                <Select value={modelName} onValueChange={setModelName}>
                  <SelectTrigger id="cfg-model" className="h-8 w-full text-xs font-mono bg-background/50 border-border">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {AI_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-sans px-1 py-0.5 rounded bg-secondary text-muted-foreground">
                            {m.provider}
                          </span>
                          <span>{m.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="default"
                type="submit"
                className="w-full mt-2 h-9 text-xs font-semibold"
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
