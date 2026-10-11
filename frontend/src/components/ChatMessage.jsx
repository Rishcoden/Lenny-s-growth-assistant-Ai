import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Bookmark, Layers } from 'lucide-react';
import Citation from './Citation';

export default function ChatMessage({
  message,
  activeCitationId,
  onCitationClick,
  onSaveInsight,
  onOpenSources,
}) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Intercept bracket citations [S1], [S2]...
  const renderTextWithCitations = (text) => {
    if (!text || typeof text !== 'string') return text;

    const parts = [];
    const citationRegex = /\[(S\d+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const citationId = match[1];
      parts.push(
        <Citation
          key={`cit-${match.index}-${citationId}`}
          id={citationId}
          isActive={activeCitationId === citationId}
          onClick={onCitationClick}
        />
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // Custom markdown component overrides to intercept citation text in paragraphs & lists
  const markdownComponents = {
    p: ({ children }) => {
      const processedChildren = React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          return renderTextWithCitations(child);
        }
        return child;
      });
      return <p>{processedChildren}</p>;
    },
    li: ({ children }) => {
      const processedChildren = React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          return renderTextWithCitations(child);
        }
        return child;
      });
      return <li>{processedChildren}</li>;
    },
  };

  const formattedTime = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="fn-message-block">
      <div className="fn-message-meta-bar">
        <div className="fn-message-origin">
          {isAssistant ? (
            <>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '50%' }} />
              <span style={{ color: 'var(--accent)' }}>SYNTHESIS</span>
              <span style={{ color: 'var(--text-muted)' }}>{'//'} LENNY ARCHIVE</span>
            </>
          ) : (
            <>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: 'var(--text-secondary)', borderRadius: '1px' }} />
              <span>INQUIRY</span>
              <span style={{ color: 'var(--text-muted)' }}>{'//'} USER</span>
            </>
          )}
        </div>
        {formattedTime && (
          <span className="technical-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
            {formattedTime}
          </span>
        )}
      </div>

      {isAssistant ? (
        <div className="fn-assistant-synthesis-box">
          <div className="editorial-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>

          <div className="fn-message-action-bar">
            <button className="fn-btn fn-btn-ghost fn-btn-sm" onClick={handleCopy} title="Copy synthesis">
              {copied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {onSaveInsight && (
              <button
                className="fn-btn fn-btn-ghost fn-btn-sm"
                onClick={() => onSaveInsight(message)}
                title="Save this answer to your insights notebook"
              >
                <Bookmark size={13} />
                <span>Save Insight</span>
              </button>
            )}

            {message.sources && message.sources.length > 0 && onOpenSources && (
              <button
                className="fn-btn fn-btn-ghost fn-btn-sm"
                onClick={() => onOpenSources(message.sources)}
                title="Open evidence inspector"
                style={{ color: 'var(--accent)', fontWeight: 600 }}
              >
                <Layers size={13} />
                <span>Evidence ({message.sources.length})</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="fn-user-inquiry-box">
          {message.content}
        </div>
      )}
    </div>
  );
}
