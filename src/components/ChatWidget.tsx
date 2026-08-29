import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Paperclip,
  ThumbsUp,
  ThumbsDown,
  MessageSquarePlus,
  Loader2,
  FileText,
  XCircle
} from 'lucide-react';

export interface ChatContext {
  disease_type: string;
  probability: number;
  risk_level: string;
  flags: string[];
  model_name: string;
  raw_features?: Record<string, number>;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  feedback?: 'like' | 'dislike';
  comment?: string;
  showCommentBox?: boolean;
  attachmentName?: string;
  latencyMs?: number;
}

interface PendingAttachment {
  name: string;
  mimeType: string;
  dataBase64?: string;
  text?: string;
}

interface ChatWidgetProps {
  context: ChatContext | null;
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: "Ask me to explain a prediction, walk through the risk factors, or answer a general question. I can also read a file you attach."
};

export const ChatWidget: React.FC<ChatWidgetProps> = ({ context }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState<string>('');
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isText = /^text\/|json|csv/.test(file.type) || /\.(txt|csv|json|md)$/i.test(file.name);

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] || '';
        setAttachment({ name: file.name, mimeType: file.type, dataBase64: base64 });
      };
      reader.readAsDataURL(file);
    } else if (isText) {
      const reader = new FileReader();
      reader.onload = () => {
        const content = (reader.result as string).slice(0, 6000);
        setAttachment({ name: file.name, mimeType: file.type || 'text/plain', text: content });
      };
      reader.readAsText(file);
    } else {
      setAttachment({ name: file.name, mimeType: file.type || 'application/octet-stream' });
    }
    e.target.value = '';
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && !attachment) return;

    const userMsg: ChatMessage = {
      id: 'u-' + Date.now(),
      role: 'user',
      text: trimmed || `Attached: ${attachment?.name}`,
      attachmentName: attachment?.name
    };
    const history = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const pendingAttachment = attachment;
    setAttachment(null);
    setIsSending(true);
    const t0 = performance.now();

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history,
          context,
          attachment: pendingAttachment
        })
      });
      const data = await resp.json();
      const latencyMs = Math.round(performance.now() - t0);
      setMessages((prev) => [
        ...prev,
        { id: 'a-' + Date.now(), role: 'assistant', text: data.reply || "I couldn't generate a response.", latencyMs }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: 'a-' + Date.now(), role: 'assistant', text: 'Something went wrong reaching the assistant. Please try again.', latencyMs: Math.round(performance.now() - t0) }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const setFeedback = (id: string, feedback: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, feedback: m.feedback === feedback ? undefined : feedback } : m))
    );
  };

  const toggleCommentBox = (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, showCommentBox: !m.showCommentBox } : m)));
  };

  const saveComment = (id: string, comment: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, comment, showCommentBox: false } : m)));
  };

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-zinc-900 text-zinc-50 shadow-lg shadow-zinc-900/20 flex items-center justify-center hover:bg-zinc-800 transition-colors"
          title="Open chat"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 w-full sm:w-96 h-full sm:h-[600px] sm:max-h-[80vh] flex flex-col bg-white/90 backdrop-blur-xl border border-zinc-900/10 sm:rounded-2xl shadow-2xl shadow-zinc-900/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-900/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-900 text-zinc-50 flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-zinc-900">Copilot Chat</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} title="Close chat" className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-900/5 hover:text-zinc-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%]">
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-zinc-900 text-zinc-50 rounded-br-sm'
                        : 'bg-zinc-900/5 text-zinc-800 rounded-bl-sm'
                    }`}
                  >
                    {m.attachmentName && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-[11px] opacity-70">
                        <FileText className="w-3 h-3" />
                        <span>{m.attachmentName}</span>
                      </div>
                    )}
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  </div>

                  {m.role === 'assistant' && m.id !== 'welcome' && (
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <button
                        type="button"
                        onClick={() => setFeedback(m.id, 'like')}
                        className={`p-1 rounded transition-colors ${
                          m.feedback === 'like' ? 'text-zinc-900' : 'text-zinc-300 hover:text-zinc-600'
                        }`}
                        title="Like"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" fill={m.feedback === 'like' ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedback(m.id, 'dislike')}
                        className={`p-1 rounded transition-colors ${
                          m.feedback === 'dislike' ? 'text-zinc-900' : 'text-zinc-300 hover:text-zinc-600'
                        }`}
                        title="Dislike"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" fill={m.feedback === 'dislike' ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCommentBox(m.id)}
                        className="p-1 rounded text-zinc-300 hover:text-zinc-600 transition-colors"
                        title="Comment"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                      </button>
                      {typeof m.latencyMs === 'number' && (
                        <span className="text-[10px] text-zinc-300 font-mono ml-0.5">
                          {m.latencyMs < 1000 ? `${m.latencyMs}ms` : `${(m.latencyMs / 1000).toFixed(1)}s`}
                        </span>
                      )}
                      {m.comment && !m.showCommentBox && (
                        <span className="text-[11px] text-zinc-400 italic truncate max-w-[140px]">"{m.comment}"</span>
                      )}
                    </div>
                  )}

                  {m.showCommentBox && (
                    <form
                      className="mt-1.5 flex items-center gap-1.5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const val = (e.currentTarget.elements.namedItem('c') as HTMLInputElement).value;
                        saveComment(m.id, val);
                      }}
                    >
                      <input
                        name="c"
                        defaultValue={m.comment || ''}
                        autoFocus
                        placeholder="Add a note…"
                        className="flex-1 text-xs bg-white border border-zinc-900/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-400"
                      />
                      <button type="submit" className="text-xs font-semibold text-zinc-700 px-2 py-1.5 hover:text-zinc-900">
                        Save
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="bg-zinc-900/5 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1.5 text-zinc-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          {/* Attachment preview */}
          {attachment && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-900/10 bg-zinc-900/[0.03]">
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 truncate">
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{attachment.name}</span>
              </div>
              <button type="button" onClick={() => setAttachment(null)} className="text-zinc-400 hover:text-zinc-700">
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input */}
          <form
            className="flex items-end gap-2 p-3 border-t border-zinc-900/10 flex-shrink-0"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFilePick} accept="image/*,text/plain,text/csv,application/json,.md" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-900/5 hover:text-zinc-700 flex-shrink-0"
              title="Attach a file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder="Ask about this result…"
              className="flex-1 resize-none bg-zinc-900/5 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 max-h-24"
            />
            <button
              type="submit"
              disabled={isSending || (!input.trim() && !attachment)}
              className="p-2 rounded-lg bg-zinc-900 text-zinc-50 disabled:opacity-30 flex-shrink-0 hover:bg-zinc-800 transition-colors"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
