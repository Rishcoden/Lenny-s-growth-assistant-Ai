import React, { useRef, useEffect } from 'react';
import { ArrowUp, CornerDownLeft } from 'lucide-react';

export default function ChatComposer({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = "Ask a question about growth, retention, strategy, or leadership...",
  disabled = false,
  label = "ASK THE LIBRARY",
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="fn-composer-container" role="region" aria-label="Research Question Composer">
      <div className="fn-composer-label-bar">
        <span className="fn-composer-label">
          <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--accent)' }} />
          {label}
        </span>
        <span className="technical-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          303 EPISODES // GROUNDED RAG
        </span>
      </div>

      <textarea
        ref={textareaRef}
        className="fn-composer-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        rows={1}
        aria-label="Ask a research inquiry"
      />

      <div className="fn-composer-footer">
        <div className="fn-composer-cues">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <CornerDownLeft size={11} /> ↵ to inquire
          </span>
          <span style={{ margin: '0 6px' }}>•</span>
          <span>⇧↵ for newline</span>
        </div>

        <button
          className="fn-btn fn-btn-primary"
          onClick={onSubmit}
          disabled={disabled || isLoading || !value.trim()}
          style={{ padding: '6px 14px' }}
          aria-label="Submit inquiry"
        >
          {isLoading ? (
            <span className="fn-status-dot online" style={{ animation: 'pulse 1s infinite' }} />
          ) : (
            <>
              <span>Inquire</span>
              <ArrowUp size={13} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
