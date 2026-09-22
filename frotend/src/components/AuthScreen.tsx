import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Code2,
  Layers,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function AuthScreen() {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const { loading, message, setMessage, signIn, signUp } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
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

    await signIn({ email, password });
  }

  const isErrorMessage =
    message.toLowerCase().includes("failed") ||
    message.toLowerCase().includes("error") ||
    message.toLowerCase().includes("no active account") ||
    message.toLowerCase().includes("unauthorized") ||
    message.toLowerCase().includes("invalid");

  return (
    <div className="min-h-screen w-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden relative selection:bg-primary/20">
      {/* Background Subtle Gradient Highlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="h-16 border-b border-border/60 bg-card/40 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-foreground">
                WebAgent
              </h1>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 font-mono font-normal text-muted-foreground border-border"
              >
                v1.0
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Autonomous Full-Stack Website Builder
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden md:inline">
            Authentication Required
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/80 border border-border text-xs text-muted-foreground font-medium">
            <Lock className="w-3 h-3 text-primary" />
            <span>Secure Access</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Side: Product Value & Branding (Hidden/Collapsed on smallest screens) */}
          <div className="lg:col-span-6 space-y-6 hidden lg:block pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Next-Gen AI Workspace</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Build & Deploy Web Apps with AI Intelligence
            </h2>

            <p className="text-muted-foreground text-sm leading-relaxed">
              Sign in to your WebAgent workspace to generate full-stack React & Node.js applications, edit code in real-time, and preview instantly.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary/80 border border-border text-primary shrink-0">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Instant Full-Stack Code Generation
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Stream modern UI components, styles, and backend integrations automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary/80 border border-border text-primary shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Live Preview & Chat Refinement
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Interact directly with your generated application and iterate via natural prompt commands.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary/80 border border-border text-primary shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Custom Model Configuration
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Bring your own API keys for OpenAI, Gemini, Claude, or Groq models.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Auth Form Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {authMode === "signin"
                    ? "Sign in to Dashboard"
                    : "Create your Account"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {authMode === "signin"
                    ? "Enter your credentials to access your WebAgent workspace."
                    : "Register below to get started with WebAgent."}
                </p>
              </div>

              {/* Toggle Mode */}
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-border/80 bg-secondary/60 p-1">
                <button
                  type="button"
                  aria-pressed={authMode === "signin"}
                  className={`min-h-9 rounded-lg px-3 text-xs sm:text-sm font-medium transition-all ${
                    authMode === "signin"
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                  }`}
                  onClick={() => {
                    setAuthMode("signin");
                    setMessage("");
                  }}
                >
                  Sign In
                </button>

                <button
                  type="button"
                  aria-pressed={authMode === "signup"}
                  className={`min-h-9 rounded-lg px-3 text-xs sm:text-sm font-medium transition-all ${
                    authMode === "signup"
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                  }`}
                  onClick={() => {
                    setAuthMode("signup");
                    setMessage("");
                  }}
                >
                  Sign Up
                </button>
              </div>

              {/* Message Banner */}
              {message && (
                <div
                  role="status"
                  className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs sm:text-sm font-medium leading-relaxed ${
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === "signup" && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="screen-username"
                      className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-primary" />
                      Username
                    </Label>
                    <Input
                      id="screen-username"
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-10 w-full text-sm bg-background/50 border-border focus:border-primary"
                      autoComplete="username"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label
                    htmlFor="screen-email"
                    className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    Email Address
                  </Label>
                  <Input
                    id="screen-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 w-full text-sm bg-background/50 border-border focus:border-primary"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="screen-password"
                    className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    Password
                  </Label>
                  <Input
                    id="screen-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 w-full text-sm bg-background/50 border-border focus:border-primary"
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
                  className="mt-2 h-11 w-full text-sm font-semibold gap-2 shadow-lg shadow-primary/20"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      <span>Processing...</span>
                    </>
                  ) : authMode === "signin" ? (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/60">
                {authMode === "signin" ? (
                  <span>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline focus:outline-none"
                      onClick={() => {
                        setAuthMode("signup");
                        setMessage("");
                      }}
                    >
                      Sign Up
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline focus:outline-none"
                      onClick={() => {
                        setAuthMode("signin");
                        setMessage("");
                      }}
                    >
                      Sign In
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-border/60 bg-card/20 text-center text-xs text-muted-foreground z-10">
        WebAgent Platform &copy; {new Date().getFullYear()} &bull; Secure Authentication Flow
      </footer>
    </div>
  );
}
