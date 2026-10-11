import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Check, ExternalLink, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';

export default function SavedInsightsPage() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const data = await api.getSavedInsights();
      setInsights(data);
    } catch (err) {
      console.error('Failed to load saved insights', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this saved insight from your notebook?')) {
      try {
        await api.deleteSavedInsight(id);
        setInsights((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        alert(`Error deleting insight: ${err.message}`);
      }
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fn-home-canvas">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div className="fn-home-rubric">
          <span>Personal Notebook // Fieldnotes</span>
        </div>
        <h1 className="fn-home-headline editorial-serif">
          Keep the ideas that matter.
        </h1>
        <p className="fn-home-lead">
          A personal research notebook of frameworks, tactics, and transcript quotations bookmarked across your inquiries.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '28px 0', fontSize: '13px' }}>
          <span className="fn-status-dot online" style={{ animation: 'pulse 1s infinite' }} />
          <span>Loading notebook entries...</span>
        </div>
      ) : insights.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '56px 20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xs)',
          }}
        >
          <BookOpen size={24} color="var(--accent)" style={{ margin: '0 auto 10px auto' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Your Notebook Is Empty</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
            Click "Save Insight" on any synthesis response during your research conversations to bookmark key takeaways here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {insights.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderLeft: '3px solid var(--accent)',
                borderRadius: 'var(--radius-xs)',
                padding: '24px',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <div className="technical-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    SAVED {new Date(item.created_at).toLocaleDateString()}
                    {item.topic && ` // ${item.topic.toUpperCase()}`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className="fn-btn fn-btn-ghost fn-btn-sm"
                    onClick={() => handleCopy(item.id, item.content)}
                    title="Copy content"
                  >
                    {copiedId === item.id ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    className="fn-btn fn-btn-ghost fn-btn-sm"
                    onClick={() => handleDelete(item.id)}
                    title="Delete insight"
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <div className="editorial-prose" style={{ fontSize: '14.5px' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {item.content}
                </ReactMarkdown>
              </div>

              {item.sources && item.sources.length > 0 && (
                <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="mono-tag" style={{ fontSize: '10px', marginBottom: '8px' }}>
                    REFERENCED EVIDENCE ({item.sources.length}) //
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {item.sources.map((src) => (
                      <div
                        key={src.id}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          backgroundColor: 'var(--surface-secondary)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-xs)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span className="fn-source-citation-id" style={{ fontSize: '9px', padding: '1px 4px' }}>
                          {src.id}
                        </span>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{src.title}</span>
                        {src.youtube_url && (
                          <a href={src.youtube_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
