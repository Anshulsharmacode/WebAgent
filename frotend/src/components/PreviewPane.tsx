type PreviewPaneProps = {
  siteUrl?: string
}

export function PreviewPane({ siteUrl }: PreviewPaneProps) {
  return (
    <section className="panel panel-preview">
      <div className="panel-head">
        <h2>Live Preview</h2>
        {siteUrl ? (
          <a className="link" href={siteUrl} target="_blank" rel="noreferrer">
            Open in new tab
          </a>
        ) : null}
      </div>
      {siteUrl ? (
        <iframe className="preview-frame" src={siteUrl} title="Generated website preview" />
      ) : (
        <div className="empty">
          Generate a website to see the live preview here.
        </div>
      )}
    </section>
  )
}
