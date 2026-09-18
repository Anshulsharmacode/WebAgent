import { FileCode2, FolderTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ProjectFilesProps = {
  files: string[];
};

export function ProjectFiles({ files }: ProjectFilesProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary">
            <FolderTree className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold text-foreground tracking-wide">
            Project Files
          </span>
        </div>
        <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-4">
          {files.length} {files.length === 1 ? "file" : "files"}
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
        {files.map((file) => (
          <div
            key={file}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card/60 border border-border/80 text-[11px] font-mono text-foreground/90 hover:bg-accent/70 hover:border-border transition-colors group cursor-default"
          >
            <FileCode2 className="w-3.5 h-3.5 text-primary/80 group-hover:text-primary shrink-0 transition-colors" />
            <span className="truncate">{file}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
