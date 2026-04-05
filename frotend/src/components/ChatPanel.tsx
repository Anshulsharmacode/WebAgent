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
  onMessageInputChange: (value: string) => void
  onApplyChangesChange: (value: boolean) => void
  onSend: () => void
}

export function ChatPanel(props: ChatPanelProps) {
  const {
    messages,
    messageInput,
    applyChanges,
    loading,
    canSend,
    onMessageInputChange,
    onApplyChangesChange,
    onSend,
  } = props

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Website Chat</h2>
      </div>

      <div className="chat-list">
        {messages.length === 0 ? (
          <p className="empty-text">Ask for guidance or request direct edits after generation.</p>
        ) : (
          messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`chat-item ${message.role}`}>
              <p className="chat-role">{message.role}</p>
              <p>{message.content}</p>
            </article>
          ))
        )}
      </div>

      <div className="chat-controls">
        <textarea
          className="field-input field-textarea"
          value={messageInput}
          onChange={(event) => onMessageInputChange(event.target.value)}
          placeholder="Example: Add a sticky navbar and improve mobile hero spacing."
        />
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={applyChanges}
            onChange={(event) => onApplyChangesChange(event.target.checked)}
          />
          Apply this change directly to project files
        </label>
        <button className="btn btn-primary" onClick={onSend} disabled={loading || !canSend}>
          {loading ? 'Processing...' : 'Send'}
        </button>
      </div>
    </section>
  )
}
