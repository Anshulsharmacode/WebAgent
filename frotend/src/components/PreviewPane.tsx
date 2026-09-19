import { useMemo, useRef, useEffect, useState } from "react";
import { downloadProject } from "../api/website";
import { Download, ExternalLink, Globe, Monitor, RefreshCw, Code, Loader2, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PreviewPaneProps = {
  siteUrl?: string;
  projectDir?: string;
  loading?: boolean;
  status?: string;
  streamingCode?: string;
};

export function PreviewPane({ siteUrl, projectDir, loading, status, streamingCode }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeContainerRef = useRef<HTMLPreElement>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

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

  // Auto switch tab to code when streaming starts if no preview yet
  useEffect(() => {
    if (loading && streamingCode) {
      setActiveTab("code");
    } else if (!loading && fixedSiteUrl) {
      setActiveTab("preview");
    }
  }, [loading, streamingCode, fixedSiteUrl]);

  // Auto scroll code stream to bottom as new tokens arrive
  useEffect(() => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
    }
  }, [streamingCode]);

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
      {/* Top Browser & Tab Navigation Bar */}
      <div className="h-12 px-4 border-b border-border bg-card/60 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/80 border border-border text-xs min-w-0">
            <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground shrink-0 text-[11px]">
              Live Workspace
            </span>
            {fixedSiteUrl ? (
              <span className="text-[11px] font-mono text-muted-foreground truncate ml-1 max-w-[160px] sm:max-w-xs md:max-w-md">
                {fixedSiteUrl}
              </span>
            ) : (
              <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 border-border font-normal text-muted-foreground ml-1">
                {loading ? "Building..." : "Inactive"}
              </Badge>
            )}
          </div>

          {/* View Mode Toggle Tabs */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 ml-2">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === "preview"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === "code"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Realtime Code</span>
              {loading && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />}
            </button>
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
      <div className="flex-1 p-3 bg-background/30 overflow-hidden relative">
        <div className="w-full h-full rounded-xl bg-card border border-border shadow-xs overflow-hidden relative">

          {/* Realtime Code Stream Tab View */}
          {activeTab === "code" || (loading && !fixedSiteUrl) ? (
            <div className="w-full h-full bg-slate-950 text-slate-100 flex flex-col font-mono text-xs overflow-hidden">
              {/* Terminal Header Bar */}
              <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200 text-xs">
                    WebSocket Code Stream & Docker Builder
                  </span>
                </div>
                {loading ? (
                  <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{status || "Generating..."}</span>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                    Complete
                  </Badge>
                )}
              </div>

              {/* Streaming Content Body */}
              <div className="flex-1 p-4 overflow-hidden flex flex-col">
                {streamingCode ? (
                  <pre
                    ref={codeContainerRef}
                    className="flex-1 overflow-y-auto whitespace-pre-wrap font-mono text-emerald-400 text-[11px] leading-relaxed custom-scrollbar selection:bg-emerald-900"
                  >
                    {streamingCode}
                  </pre>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mb-1" />
                    <p className="text-xs text-slate-300 font-sans font-medium">
                      {status || "Waiting for LLM generation..."}
                    </p>
                    <p className="text-[11px] text-slate-500 font-sans max-w-sm text-center">
                      Code files will stream token-by-token over WebSocket in real time before building the container.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : fixedSiteUrl ? (
            /* Live Website Preview (Iframe) */
            <div className="w-full h-full relative">
              <iframe
                ref={iframeRef}
                className="w-full h-full border-none bg-white"
                src={fixedSiteUrl}
                title="Generated website preview"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-top-navigation allow-popups-to-escape-sandbox allow-modals"
              />
              {/* Rebuilding Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-foreground p-6">
                  <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <div className="text-center space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                      {status || "Updating website container..."}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Applying changes and rebuilding live container...
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Inactive State */
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
