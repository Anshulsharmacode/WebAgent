import type { ProjectType } from '../types/website'

type BuildFormProps = {
  prompt: string
  projectName: string
  projectType: ProjectType
  loading: boolean
  canStop: boolean
  onPromptChange: (val: string) => void
  onProjectNameChange: (val: string) => void
  onProjectTypeChange: (val: ProjectType) => void
  onBuild: () => void
  onStop: () => void
}

export function BuildForm({
  prompt,
  projectName,
  projectType,
  loading,
  canStop,
  onPromptChange,
  onProjectNameChange,
  onProjectTypeChange,
  onBuild,
  onStop,
}: BuildFormProps) {
  return (
    <section className="panel">
      <div className="field-group">
        <label className="field-label" htmlFor="prompt">Prompt</label>
        <textarea
          id="prompt"
          className="field-input field-textarea"
          placeholder="Describe the website you want to build..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label" htmlFor="name">Project Name</label>
          <input
            id="name"
            type="text"
            className="field-input"
            placeholder="my-cool-site"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="type">Type</label>
          <select
            id="type"
            className="field-input"
            value={projectType}
            onChange={(e) => onProjectTypeChange(e.target.value as ProjectType)}
          >
            <option value="classic_html">Classic HTML</option>
            <option value="react">React (Vite)</option>
          </select>
        </div>
      </div>

      <div className="button-row" style={{ marginTop: '0.5rem' }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={loading || !prompt.trim()}
          onClick={onBuild}
        >
          {loading ? 'Generating...' : 'Generate Website'}
        </button>
        {canStop && (
          <button
            className="btn btn-destructive"
            disabled={loading}
            onClick={onStop}
            title="Stop & Remove Container"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}
