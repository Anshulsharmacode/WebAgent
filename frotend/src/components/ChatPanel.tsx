import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatPanelProps = {
  messages: Message[];
  messageInput: string;
  applyChanges: boolean;
  loading: boolean;
  canSend: boolean;
  streamingCode?: string;
  onMessageInputChange: (val: string) => void;
  onApplyChangesChange: (val: boolean) => void;
  onSend: () => void;
};

export function ChatPanel({
  messages,
  messageInput,
  applyChanges,
  loading,
  canSend,
  streamingCode,
  onMessageInputChange,
  onApplyChangesChange,
  onSend,
}: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of message list on new messages or opening
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Auto-resize textarea like ChatGPT
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 140);
    textarea.style.height = `${Math.max(newHeight, 44)}px`;
  }, [messageInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend && !loading) {
        onSend();
      }
    }
  };

  return (
    <div
      className={`transition-all duration-300 ease-in-out flex flex-col bg-card/95 border border-border shadow-xl backdrop-blur-md rounded-2xl mb-4 ml-4 mr-4 shrink-0 overflow-hidden ${
        isOpen ? "h-80 md:h-96" : "h-12"
      }`}
    >
      {/* Panel Header & Toggle Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/50 cursor-pointer select-none hover:bg-muted/50 transition-colors shrink-0"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              AI Assistant Chat & Modifier
            </span>
            {messages.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">
                {messages.length}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <span className="text-[11px] font-medium hidden sm:inline">
            {isOpen ? "Collapse" : "Open Chat"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 p-0 hover:bg-transparent"
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isOpen && (
        <div className="flex-1 flex flex-col min-h-0 p-3 md:p-4">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1.5 mb-3 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 text-center p-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  Assistant Chat & Live Modifier
                </p>
                <p className="text-[11px] text-muted-foreground max-w-sm leading-relaxed">
                  Instruct the AI to modify code, add components, alter color
                  schemes, or answer technical questions.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%] ${
                    msg.role === "user" ? "self-end flex-row-reverse" : "self-start"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 shadow-xs text-xs ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-secondary text-primary border border-border"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground font-medium rounded-tr-xs shadow-xs"
                        : "bg-muted/60 border border-border text-card-foreground rounded-tl-xs shadow-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && Boolean(streamingCode) && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto shadow-inner my-1">
                <div className="flex items-center gap-2 mb-1.5 text-slate-400 font-sans text-[10px] uppercase tracking-wider font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>LLM Live Stream</span>
                </div>
                <pre className="whitespace-pre-wrap max-h-36 overflow-y-auto custom-scrollbar font-mono text-[11px]">
                  {streamingCode}
                </pre>
              </div>
            )}
            <div ref={messagesEndRef} />

          </div>

          {/* GPT-Style Input Bar */}
          <div className="shrink-0 flex flex-col gap-2">
            {/* Options Bar */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground hover:text-foreground cursor-pointer select-none transition-colors">
                <div
                  onClick={() => onApplyChangesChange(!applyChanges)}
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    applyChanges
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-input border-border"
                  }`}
                >
                  {applyChanges && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span>Apply edits directly to container files</span>
              </label>
            </div>

            {/* GPT-like Multi-line Input Box */}
            <div className="relative flex items-end rounded-2xl border border-border bg-muted/40 hover:bg-muted/60 focus-within:bg-background focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1.5 shadow-xs">
              <textarea
                ref={textareaRef}
                value={messageInput}
                onChange={(e) => onMessageInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question or request a change (Shift+Enter for newline)..."
                rows={1}
                className="flex-1 bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none min-h-[44px] max-h-[140px] leading-relaxed custom-scrollbar"
              />

              <Button
                variant="default"
                size="icon"
                disabled={!canSend || loading}
                onClick={onSend}
                className="w-9 h-9 rounded-xl shrink-0 cursor-pointer shadow-xs mb-0.5 mr-0.5 transition-all"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
