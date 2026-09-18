import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SessionDetailsProps = {
  metadata: string[][];
};

export function SessionDetails({ metadata }: SessionDetailsProps) {
  if (!metadata || metadata.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary">
            <Activity className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold text-foreground tracking-wide">
            Environment & Container
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-border">
          Active
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {metadata.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col gap-1 p-2.5 rounded-lg bg-card/60 border border-border/80 hover:border-border transition-colors"
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold font-mono">
              {label}
            </span>
            <span className="text-xs font-mono font-medium text-foreground truncate" title={value}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
