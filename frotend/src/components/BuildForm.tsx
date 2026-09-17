import type { ProjectType } from '../types/website'

type BuildFormProps = {
  prompt: string
  projectName: string
  projectType: ProjectType
  modelName: string
  apiKey: string
  loading: boolean
  canStop: boolean
  onPromptChange: (val: string) => void
  onProjectNameChange: (val: string) => void
  onProjectTypeChange: (val: ProjectType) => void
  onModelNameChange: (val: string) => void
  onApiKeyChange: (val: string) => void
  onBuild: () => void
  onStop: () => void
}

export function BuildForm({
  prompt,
  projectName,
  projectType,
  modelName,
  apiKey,
  loading,
  canStop,
  onPromptChange,
  onProjectNameChange,
  onProjectTypeChange,
  onModelNameChange,
  onApiKeyChange,
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
            <option value="react">React (Vite)</option>
            <option value="classic_html">Classic HTML</option>
          </select>
        </div>
      </div>

      <div className="field-row" style={{ marginTop: '0.5rem' }}>
        <div className="field-group">
          <label className="field-label" htmlFor="model">Model Provider</label>
          <select
            id="model"
            className="field-input"
            value={modelName}
            onChange={(e) => onModelNameChange(e.target.value)}
          >
            <option value="gemini-2.5-flash">Google Gemini 2.5 Flash</option>
            <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
            <option value="gpt-4o">OpenAI GPT-4o</option>
            <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
            <option value="claude-3-5-sonnet-20241022">Anthropic Claude 3.5 Sonnet</option>
            <option value="deepseek/deepseek-chat">DeepSeek Chat</option>
            <option value="groq/llama-3.3-70b-versatile">Groq Llama 3.3</option>
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="apiKey">API Key (Optional)</label>
          <input
            id="apiKey"
            type="password"
            className="field-input"
            placeholder="Override API key"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
          />
        </div>
      </div>

      <div className="button-row" style={{ marginTop: '0.75rem' }}>
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
