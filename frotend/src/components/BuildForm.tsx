import type { ProjectType } from '../types/website'

type BuildFormProps = {
  prompt: string
  projectName: string
  projectType: ProjectType
  loading: boolean
  canStop: boolean
  onPromptChange: (value: string) => void
  onProjectNameChange: (value: string) => void
  onProjectTypeChange: (value: ProjectType) => void
  onBuild: () => void
  onStop: () => void
}

export function BuildForm(props: BuildFormProps) {
  const {
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
  } = props

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Build Prompt</h2>
        <span className="pill">v0 clone flow</span>
      </div>

      <label className="field-label" htmlFor="prompt">
        Prompt
      </label>
      <textarea
        id="prompt"
        className="field-input field-textarea"
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="Create a modern AI healthcare landing page with pricing, testimonials, and FAQ."
      />

      <div className="field-row">
        <div>
          <label className="field-label" htmlFor="projectName">
            Project Name
          </label>
          <input
            id="projectName"
            className="field-input"
            value={projectName}
            onChange={(event) => onProjectNameChange(event.target.value)}
            placeholder="ai-healthcare"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="projectType">
            Project Type
          </label>
          <select
            id="projectType"
            className="field-input"
            value={projectType}
            onChange={(event) => onProjectTypeChange(event.target.value as ProjectType)}
          >
            <option value="classic_html">Classic HTML</option>
            <option value="react">React</option>
          </select>
        </div>
      </div>

      <div className="button-row">
        <button className="btn btn-primary" onClick={onBuild} disabled={loading || !prompt.trim()}>
          {loading ? 'Generating...' : 'Generate Website'}
        </button>
        <button className="btn btn-ghost" onClick={onStop} disabled={loading || !canStop}>
          Stop Container
        </button>
      </div>
    </section>
  )
}
