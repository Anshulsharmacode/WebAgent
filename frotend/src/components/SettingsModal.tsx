import { useEffect, useState } from 'react'
import { getApiKeyModel, signInUser, signOutUser, signUpUser, updateApiKeyModel } from '../api/auth'
import { getAccessToken } from '../api/http'

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
  onSaved: (apiKey?: string, modelName?: string) => void
}

export function SettingsModal({ isOpen, onClose, onSaved }: SettingsModalProps) {
  const [tab, setTab] = useState<'auth' | 'config'>('auth')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  const [apiKey, setApiKey] = useState('')
  const [modelName, setModelName] = useState('gemini-2.5-flash')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getAccessToken()))

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      loadConfig()
    }
  }, [isOpen, isLoggedIn])

  async function loadConfig() {
    try {
      const data = await getApiKeyModel()
      if (data.api_key) setApiKey(data.api_key)
      if (data.model_name) setModelName(data.model_name)
    } catch {
      // Ignored if unauthenticated or error
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      if (authMode === 'signup') {
        const res = await signUpUser({ email, password, username: username || email.split('@')[0] })
        setMessage(res.message || 'Account created successfully! Please sign in.')
        setAuthMode('signin')
      } else {
        await signInUser({ email, password })
        setIsLoggedIn(true)
        setMessage('Signed in successfully!')
        setTab('config')
        await loadConfig()
      }
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      if (isLoggedIn) {
        await updateApiKeyModel({ api_key: apiKey.trim(), model_name: modelName.trim() })
      }
      onSaved(apiKey.trim(), modelName.trim())
      setMessage('Settings saved successfully!')
      setTimeout(() => {
        onClose()
      }, 800)
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function handleSignOut() {
    signOutUser()
    setIsLoggedIn(false)
    setMessage('Signed out.')
    setApiKey('')
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div className="panel" style={{
        width: '450px',
        maxWidth: '90vw',
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Account & Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
              fontSize: '1.25rem',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #27272a', paddingBottom: '0.5rem' }}>
          <button
            className={`btn ${tab === 'auth' ? 'btn-primary' : ''}`}
            onClick={() => setTab('auth')}
            style={{ flex: 1, padding: '0.4rem' }}
          >
            {isLoggedIn ? 'Account Status' : 'Sign In / Sign Up'}
          </button>
          <button
            className={`btn ${tab === 'config' ? 'btn-primary' : ''}`}
            onClick={() => setTab('config')}
            style={{ flex: 1, padding: '0.4rem' }}
          >
            API & Model Config
          </button>
        </div>

        {message && (
          <div style={{
            padding: '0.6rem 0.8rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            background: message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') || message.toLowerCase().includes('no active account') || message.toLowerCase().includes('unauthorized') ? '#450a0a' : '#064e3b',
            color: message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') || message.toLowerCase().includes('no active account') || message.toLowerCase().includes('unauthorized') ? '#fca5a5' : '#6ee7b7',
          }}>
            {message}
          </div>
        )}

        {tab === 'auth' && (
          <div>
            {isLoggedIn ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ color: '#22c55e', fontWeight: 600, marginBottom: '0.5rem' }}>✓ Logged In</p>
                <p style={{ fontSize: '0.875rem', color: '#a1a1aa', marginBottom: '1.5rem' }}>Your API keys and model settings will be synced with your account.</p>
                <button className="btn btn-destructive" onClick={handleSignOut} style={{ width: '100%' }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuth}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    type="button"
                    style={{ flex: 1, background: authMode === 'signin' ? '#27272a' : 'transparent', border: 'none', color: '#fff', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}
                    onClick={() => setAuthMode('signin')}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    style={{ flex: 1, background: authMode === 'signup' ? '#27272a' : 'transparent', border: 'none', color: '#fff', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}
                    onClick={() => setAuthMode('signup')}
                  >
                    Sign Up
                  </button>
                </div>

                {authMode === 'signup' && (
                  <div className="field-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="field-label">Username</label>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                )}

                <div className="field-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    className="field-input"
                    placeholder="email@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="field-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="field-label">Password</label>
                  <input
                    type="password"
                    className="field-input"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Processing...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              </form>
            )}
          </div>
        )}

        {tab === 'config' && (
          <form onSubmit={handleSaveConfig}>
            <div className="field-group" style={{ marginBottom: '0.75rem' }}>
              <label className="field-label">API Key</label>
              <input
                type="password"
                className="field-input"
                placeholder="AIzaSy... / sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.25rem' }}>
                Used for Gemini, OpenAI, Anthropic, DeepSeek, or Groq calls.
              </span>
            </div>

            <div className="field-group" style={{ marginBottom: '1.25rem' }}>
              <label className="field-label">Default Model Name</label>
              <select
                className="field-input"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              >
                <option value="gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                <option value="gpt-4o">OpenAI GPT-4o</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
                <option value="claude-3-5-sonnet-20241022">Anthropic Claude 3.5 Sonnet</option>
                <option value="deepseek/deepseek-chat">DeepSeek Chat (V3)</option>
                <option value="groq/llama-3.3-70b-versatile">Groq Llama 3.3 70B</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
