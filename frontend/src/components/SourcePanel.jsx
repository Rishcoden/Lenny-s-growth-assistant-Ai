import React, { useEffect, useRef } from 'react';
import { ExternalLink, X, BookOpen, Layers } from 'lucide-react';

export default function SourcePanel({
  sources = [],
  activeCitationId = null,
  isOpen = true,
  onClose,
  onSelectCitation,
}) {
  const cardRefs = useRef({});

  // Auto-scroll to selected citation card
  useEffect(() => {
    if (activeCitationId && cardRefs.current[activeCitationId]) {
      cardRefs.current[activeCitationId].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeCitationId]);

  if (!isOpen) return null;

  return (
    <aside className="fn-evidence-inspector" aria-label="Evidence Inspector">
      <div className="fn-inspector-header">
        <div className="fn-inspector-title">
          <Layers size={14} color="var(--accent)" />
          <span>Evidence / Sources</span>
          {sources.length > 0 && (
            <span className="fn-badge fn-badge-accent" style={{ marginLeft: '4px' }}>
              {sources.length} {sources.length === 1 ? 'PASSAGE' : 'PASSAGES'}
            </span>
          )}
        </div>
        <button
          className="fn-btn-icon"
          onClick={onClose}
          aria-label="Close evidence inspector"
          title="Close inspector"
        >
          <X size={15} />
        </button>
      </div>

      <div className="fn-evidence-scroll-area">
        {sources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)' }}>
            <BookOpen size={22} style={{ margin: '0 auto 10px auto', color: 'var(--text-muted)' }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Awaiting Inquiry
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              Supporting transcript passages, speaker citations, and episode timestamps will appear here once an inquiry is processed.
            </p>
          </div>
        ) : (
          sources.map((source) => {
            const isFocused = activeCitationId === source.id;
            return (
              <div
                key={source.id}
                ref={(el) => (cardRefs.current[source.id] = el)}
                className={`fn-source-item ${isFocused ? 'highlighted' : ''}`}
                onClick={() => onSelectCitation && onSelectCitation(source.id)}
              >
                <div className="fn-source-meta-row">
                  <span className="fn-source-citation-id">{source.id}</span>
                  {source.relevance_score !== null && source.relevance_score !== undefined && (
                    <span className="fn-badge fn-badge-neutral" title="Vector cosine similarity">
                      {Math.round(source.relevance_score * 100)}% Match
                    </span>
                  )}
                </div>

                <div className="fn-source-title">{source.title}</div>
                <div className="fn-source-guest">Guest: {source.guest}</div>

                <div className="fn-source-passage-box">
                  "{source.excerpt}"
                </div>

                <div className="fn-source-footer-row">
                  <span>
                    {source.publish_date ? `Aired ${source.publish_date}` : 'Podcast Library'}
                  </span>
                  {source.youtube_url ? (
                    <a
                      href={source.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fn-btn fn-btn-ghost fn-btn-sm"
                      style={{ padding: '2px 6px', fontSize: '11px', color: 'var(--accent)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Watch Episode</span>
                      <ExternalLink size={11} />
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
