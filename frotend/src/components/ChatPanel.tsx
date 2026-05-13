type Message = {
  role: 'user' | 'assistant'
  content: string
}

type ChatPanelProps = {
  messages: Message[]
  messageInput: string
  applyChanges: boolean
  loading: boolean
  canSend: boolean
  onMessageInputChange: (val: string) => void
  onApplyChangesChange: (val: boolean) => void
  onSend: () => void
}

export function ChatPanel({
  messages,
  messageInput,
  applyChanges,
  loading,
  canSend,
  onMessageInputChange,
  onApplyChangesChange,
  onSend,
}: ChatPanelProps) {
  return (
    <section className="chat-panel">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '0.875rem' }}>Ask the assistant to make changes or explain the code.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role}`}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem', opacity: 0.7 }}>
                {msg.role}
              </div>
              <p style={{ margin: 0 }}>{msg.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="chat-input-area">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="apply"
            checked={applyChanges}
            onChange={(e) => onApplyChangesChange(e.target.checked)}
          />
          <label htmlFor="apply" style={{ fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}>
            Apply changes to code
          </label>
        </div>
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="field-input"
            placeholder="Ask a question or request a change..."
            value={messageInput}
            onChange={(e) => onMessageInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canSend && onSend()}
          />
          <button
            className="btn btn-primary"
            disabled={!canSend || loading}
            onClick={onSend}
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </section>
  )
}
