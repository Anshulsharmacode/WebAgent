import { useMemo, useState } from 'react'
import { buildWebsite, chatWebsite, stopWebsite } from './api/website'
import { BuildForm } from './components/BuildForm'
import { ChatPanel } from './components/ChatPanel'
import { PreviewPane } from './components/PreviewPane'
import { ProjectFiles } from './components/ProjectFiles'
import type { BuildWebsiteResponse, ChatWebsiteResponse, ProjectType } from './types/website'
import './App.css'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

function App() {
  const [prompt, setPrompt] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState<ProjectType>('react')
  const [applyChanges, setApplyChanges] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [buildResult, setBuildResult] = useState<BuildWebsiteResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Ready')

  const siteUrl = buildResult?.site_url
  const projectDir = buildResult?.project_dir
  const files = buildResult?.files ?? []

  const metadata = useMemo(() => {
    if (!buildResult) {
      return []
    }
    return [
      ['Type', buildResult.project_type],
      ['Port', String(buildResult.host_port)],
      ['Container', buildResult.container_name],
    ]
  }, [buildResult])

  async function handleBuild() {
    if (!prompt.trim()) {
      return
    }

    setLoading(true)
    setStatus('Generating website...')
    try {
      const result = await buildWebsite({
        prompt: prompt.trim(),
        project_name: projectName.trim() || undefined,
        project_type: projectType,
      })
      setBuildResult(result)
      setMessages([])
      setStatus(`Website generated successfully.`)
    } catch (error) {
      setStatus((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!buildResult || !messageInput.trim()) {
      return
    }

    const currentMessage = messageInput.trim()
    setLoading(true)
    setMessageInput('')
    setMessages((prev) => [...prev, { role: 'user', content: currentMessage }])
    setStatus(applyChanges ? 'Applying changes...' : 'Thinking...')

    try {
      const response = await chatWebsite({
        site_url: buildResult.site_url,
        message: currentMessage,
        apply_changes: applyChanges,
        project_dir: buildResult.project_dir,
        project_name: buildResult.plan?.name ?? (projectName.trim() || undefined),
        container_name: buildResult.container_name,
        project_type: buildResult.project_type,
      })

      applyChatResponse(response)
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: (error as Error).message }])
      setStatus((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function applyChatResponse(response: ChatWebsiteResponse) {
    setMessages((prev) => [...prev, { role: 'assistant', content: response.answer }])

    if (!buildResult) {
      return
    }

    const nextBuild: BuildWebsiteResponse = {
      ...buildResult,
      container_id: response.container_id ?? buildResult.container_id,
      container_name: response.container_name ?? buildResult.container_name,
      host_port: response.host_port ?? buildResult.host_port,
      image_tag: response.image_tag ?? buildResult.image_tag,
      site_url: response.site_url ?? buildResult.site_url,
      project_type: response.project_type ?? buildResult.project_type,
      files: response.generated_files ? Object.keys(response.generated_files) : buildResult.files,
      generated_files: response.generated_files ?? buildResult.generated_files,
    }

    setBuildResult(nextBuild)
    if (response.changes_applied) {
      setStatus(response.change_summary || 'Changes applied.')
      return
    }
    setStatus('Ready')
  }

  async function handleStop() {
    if (!buildResult) {
      return
    }
    setLoading(true)
    setStatus('Stopping...')
    try {
      await stopWebsite({
        container_name: buildResult.container_name,
      })
      setStatus('Stopped.')
      setBuildResult(null)
    } catch (error) {
      setStatus((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <p className="topbar-eyebrow">v0 Clone</p>
          <h1>Site Generator</h1>
        </div>
        <div className="status-line">
          <span className="status-indicator" style={{ background: loading ? '#f59e0b' : '#22c55e' }}></span>
          {status}
        </div>
      </header>

      <section className="workspace">
        <aside className="left-column">
          <BuildForm
            prompt={prompt}
            projectName={projectName}
            projectType={projectType}
            loading={loading}
            canStop={Boolean(buildResult)}
            onPromptChange={setPrompt}
            onProjectNameChange={setProjectName}
            onProjectTypeChange={setProjectType}
            onBuild={handleBuild}
            onStop={handleStop}
          />

          {metadata.length > 0 && (
            <div className="panel">
              <div className="panel-head">
                <h2>Session Details</h2>
              </div>
              <div className="meta-list">
                {metadata.map(([label, value]) => (
                  <div key={label} className="meta-item">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-head">
                <h2>Generated Files</h2>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <ProjectFiles files={files} />
              </div>
            </div>
          )}
        </aside>

        <section className="right-column">
          <PreviewPane siteUrl={siteUrl} projectDir={projectDir} />
          <ChatPanel
            messages={messages}
            messageInput={messageInput}
            applyChanges={applyChanges}
            loading={loading}
            canSend={Boolean(buildResult && messageInput.trim())}
            onMessageInputChange={setMessageInput}
            onApplyChangesChange={setApplyChanges}
            onSend={handleSend}
          />
        </section>
      </section>
    </main>
  )
}

export default App
