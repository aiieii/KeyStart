import React, { useState } from 'react';
import { fetchChatResponse } from '../utils/affordabilityEngine';
import { MessageSquare, X, Bot } from 'lucide-react';

/**
 * Floating AI Housing Chat Assistant.
 * Uses Gemini to answer user queries about housing affordability.
 */
export default function ChatAssistant({ inputs, budget, listings }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm your KeyStart AI assistant. Ask me anything about housing in Singapore — like "Can I afford a condo room?" or "What's the cheapest area near an MRT?"`
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const handleSend = async () => {
    if (!userInput.trim() || loading) return;
    const newMsg = { role: 'user', content: userInput };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setUserInput('');
    setLoading(true);
    try {
      const reply = await fetchChatResponse(updated, inputs, budget, apiKey);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      console.error('Chat error', e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not answer right now. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating bubble button */}
      <button
        type="button"
        className="chat-float-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI Housing Assistant"
      >
        {open ? <X size={22} className="icon-sage" /> : <MessageSquare size={22} className="icon-sage" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-overlay">
          <div className="chat-panel">
            {/* Header */}
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={16} color="var(--sage)" />
                <h3>KeyStart AI Assistant</h3>
              </div>
              <button type="button" className="chat-close" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="chat-body" id="chat-body">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="chat-bubble assistant" style={{ opacity: 0.6 }}>
                  Thinking…
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="chat-input-bar">
              <input
                type="text"
                value={userInput}
                placeholder="Ask about rent, roommates, areas…"
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !userInput.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
