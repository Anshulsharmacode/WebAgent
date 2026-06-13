import { useMemo, useRef, useEffect } from "react";

type PreviewPaneProps = {
  siteUrl?: string;
  projectDir?: string;
};

export function PreviewPane({ siteUrl, projectDir }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const downloadUrl = useMemo(() => {
    if (!projectDir) return null;
    const apiBase = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ?? "";
    return `${apiBase}/llm/download/?project_dir=${encodeURIComponent(projectDir)}`;
  }, [projectDir]);

  // Fix localhost URL if needed
  const fixedSiteUrl = useMemo(() => {
    if (!siteUrl) {
      console.log("PreviewPane: No siteUrl provided");
      return undefined;
    }
    console.log("PreviewPane: Original siteUrl:", siteUrl);

    let url = siteUrl;

    // If localhost, we need to check if we're accessing from localhost too
    if (url.includes("localhost")) {
      // If the current page is also on localhost, keep localhost
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        console.log(
          "PreviewPane: Current page is on localhost, keeping localhost",
        );
      } else {
        // If current page is on a different hostname, replace localhost with that hostname
        const hostname = window.location.hostname;
        url = url.replace("localhost", hostname);
        console.log(
          "PreviewPane: Replaced localhost with",
          hostname,
          "->",
          url,
        );
      }
    }

    // Ensure protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `http://${url}`;
    }

    console.log("PreviewPane: Final URL:", url);
    return url;
  }, [siteUrl]);

  // Update iframe when URL changes
  useEffect(() => {
    if (iframeRef.current && fixedSiteUrl) {
      console.log("PreviewPane: Setting iframe src to", fixedSiteUrl);

      // Test if the URL is accessible before setting it
      fetch(fixedSiteUrl, { method: "HEAD", mode: "no-cors" })
        .then(() => {
          console.log("PreviewPane: URL is accessible");
          if (iframeRef.current) {
            iframeRef.current.src = fixedSiteUrl;
          }
        })
        .catch((error) => {
          console.error("PreviewPane: URL is not accessible", error);
          // Try anyway, maybe it's a CORS issue
          if (iframeRef.current) {
            iframeRef.current.src = fixedSiteUrl;
          }
        });
    }
  }, [fixedSiteUrl]);

  const handleRefresh = () => {
    if (iframeRef.current && fixedSiteUrl) {
      console.log("PreviewPane: Refreshing iframe");
      iframeRef.current.src = fixedSiteUrl;
    }
  };

  return (
    <section className="preview-container">
      <div className="preview-header">
        <h2
          className="field-label"
          style={{
            margin: 0,
            fontSize: "0.875rem",
            color: "var(--foreground)",
          }}
        >
          Live Preview
        </h2>
        <div className="button-row">
          {downloadUrl && (
            <a
              href={downloadUrl}
              className="btn btn-ghost"
              style={{
                fontSize: "0.75rem",
                height: "28px",
                padding: "0 0.75rem",
              }}
            >
              Download ZIP
            </a>
          )}
          {fixedSiteUrl && (
            <>
              <button
                onClick={handleRefresh}
                className="btn btn-ghost"
                style={{
                  fontSize: "0.75rem",
                  height: "28px",
                  padding: "0 0.75rem",
                  cursor: "pointer",
                  border: "1px solid var(--border)",
                }}
              >
                Refresh
              </button>
              <a
                href={fixedSiteUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
                style={{
                  fontSize: "0.75rem",
                  height: "28px",
                  padding: "0 0.75rem",
                }}
              >
                Open Tab
              </a>
            </>
          )}
        </div>
        {fixedSiteUrl && (
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--muted-foreground)",
              marginTop: "8px",
              padding: "0 0.5rem",
              wordBreak: "break-all",
            }}
          >
            Preview: {fixedSiteUrl}
          </div>
        )}
      </div>

      <div className="preview-frame-wrapper">
        {fixedSiteUrl ? (
          <iframe
            ref={iframeRef}
            className="preview-frame"
            src={fixedSiteUrl}
            title="Generated website preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-top-navigation allow-popups-to-escape-sandbox allow-modals"
            style={{ width: "100%", height: "100%", border: "none" }}
            onError={() =>
              console.error("Failed to load preview:", fixedSiteUrl)
            }
            onLoad={() => {
              console.log(
                "PreviewPane: Iframe loaded successfully from",
                fixedSiteUrl,
              );
            }}
          />
        ) : (
          <div className="empty-state">
            <p>Generate a website to see the live preview here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
