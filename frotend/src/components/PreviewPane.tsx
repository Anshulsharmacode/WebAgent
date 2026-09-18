import { useMemo, useRef, useEffect } from "react";
import { downloadProject } from "../api/website";
import { Download, ExternalLink, Globe, Monitor, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PreviewPaneProps = {
  siteUrl?: string;
  projectDir?: string;
};

export function PreviewPane({ siteUrl, projectDir }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fixedSiteUrl = useMemo(() => {
    if (!siteUrl) return undefined;
    let url = siteUrl;

    if (url.includes("localhost")) {
      if (
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        url = url.replace("localhost", window.location.hostname);
      }
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `http://${url}`;
    }

    return url;
  }, [siteUrl]);

  useEffect(() => {
    if (iframeRef.current && fixedSiteUrl) {
      iframeRef.current.src = fixedSiteUrl;
    }
  }, [fixedSiteUrl]);

  const handleRefresh = () => {
    if (iframeRef.current && fixedSiteUrl) {
      iframeRef.current.src = fixedSiteUrl;
    }
  };

  const handleDownload = () => {
    if (!projectDir) return;
    downloadProject(projectDir).catch((error) => {
      console.error("Failed to download project:", error);
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-background/50 overflow-hidden relative">
      {/* Top Browser Bar */}
      <div className="h-12 px-4 border-b border-border bg-card/60 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/80 border border-border text-xs min-w-0">
            <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground shrink-0 text-[11px]">
              Live Preview
            </span>
            {fixedSiteUrl ? (
              <span className="text-[11px] font-mono text-muted-foreground truncate ml-1 max-w-[200px] sm:max-w-xs md:max-w-md">
                {fixedSiteUrl}
              </span>
            ) : (
              <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 border-border font-normal text-muted-foreground ml-1">
                Inactive
              </Badge>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {projectDir && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-7 text-xs gap-1.5 px-2.5 border-border bg-card/60 hover:bg-accent"
              title="Download Project ZIP"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">ZIP</span>
            </Button>
          )}

          {fixedSiteUrl && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="h-7 text-xs gap-1.5 px-2.5 border-border bg-card/60 hover:bg-accent"
                title="Refresh Preview"
              >
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-7 text-xs gap-1.5 px-2.5 border-border bg-card/60 hover:bg-accent"
                title="Open in new tab"
              >
                <a href={fixedSiteUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Open</span>
                </a>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Frame Wrapper */}
      <div className="flex-1 p-3 bg-background/30 overflow-hidden">
        <div className="w-full h-full rounded-xl bg-card border border-border shadow-xs overflow-hidden relative">
          {fixedSiteUrl ? (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-none bg-white"
              src={fixedSiteUrl}
              title="Generated website preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-top-navigation allow-popups-to-escape-sandbox allow-modals"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-secondary/80 border border-border flex items-center justify-center shadow-inner">
                <Monitor className="w-6 h-6 text-muted-foreground/80" />
              </div>
              <div className="max-w-sm space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  No preview currently active
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Enter a prompt in the sidebar and click{" "}
                  <span className="text-primary font-medium">Generate Website</span> to launch your live preview.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
