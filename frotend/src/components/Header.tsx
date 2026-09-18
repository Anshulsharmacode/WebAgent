import { Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type HeaderProps = {
  status: string;
  loading: boolean;
  onOpenSettings: () => void;
};

export function Header({ status, loading, onOpenSettings }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between shrink-0 z-20">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              WebAgent
            </h1>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono font-normal text-muted-foreground border-border">
              v1.0
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Autonomous Full-Stack Website Builder
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border text-xs">
          <span className="relative flex h-2 w-2">
            {loading && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                loading ? "bg-primary" : "bg-emerald-500"
              }`}
            />
          </span>
          <span className="text-[11px] font-medium text-foreground capitalize">
            {status}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSettings}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground border-border bg-card/60 hover:bg-accent"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </div>
    </header>
  );
}
