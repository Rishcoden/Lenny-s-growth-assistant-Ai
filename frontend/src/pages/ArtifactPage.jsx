import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Code,
  Eye,
  FileText,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import {
  buildEditorialDocument,
  exportArtifactAsHtml
} from '../utils/artifactDocument';

export default function ArtifactPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [artifact, setArtifact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'markdown'
  const [feedback, setFeedback] = useState(null);

  // Observe active theme on <html> for theme-consistent iframe preview
  const [currentTheme, setCurrentTheme] = useState(() => {
    return (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      const active = document.documentElement.getAttribute('data-theme') || 'light';
      setCurrentTheme(active);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Fetch artifact payload
  useEffect(() => {
    let isMounted = true;
    const fetchArtifact = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getArtifact(id);
        if (isMounted) {
          setArtifact(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load editorial artifact.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchArtifact();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Generate self-contained editorial document for the sandboxed iframe
  const previewHtml = useMemo(() => {
    if (!artifact) return '';
    return buildEditorialDocument({
      artifact,
      isDark: currentTheme === 'dark',
      forExport: false,
    });
  }, [artifact, currentTheme]);

  // Contextual copy action
  const handleCopy = async () => {
    if (!artifact) return;
    try {
      const isMarkdownMode = viewMode === 'markdown';
      const content = isMarkdownMode
        ? (artifact.markdown || '')
        : buildEditorialDocument({ artifact, isDark: false, forExport: true });

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        // Fallback for environments lacking clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setFeedback({
        type: 'success',
        message: isMarkdownMode ? 'Markdown copied' : 'Editorial HTML copied',
      });
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Unable to copy to clipboard',
      });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Standalone offline HTML export
  const handleExport = () => {
    if (!artifact) return;
    try {
      exportArtifactAsHtml(artifact);
      setFeedback({
        type: 'success',
        message: 'HTML publication downloaded',
      });
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Export failed: ${err.message}`,
      });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Safe publication date formatting
  const formattedDate = useMemo(() => {
    if (!artifact?.created_at) return null;
    try {
      const d = new Date(artifact.created_at);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (_) {
      return null;
    }
  }, [artifact?.created_at]);

  if (loading) {
    return (
      <div className="fn-home-canvas" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', padding: '60px 36px' }}>
        <span className="fn-status-dot online" style={{ animation: 'pulse 1s infinite' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading FIELDNOTES editorial artifact...</span>
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="fn-home-canvas" style={{ maxWidth: '860px', padding: '40px 36px' }}>
        <button
          className="fn-btn fn-btn-secondary fn-btn-sm"
          onClick={() => navigate(-1)}
          style={{ marginBottom: '20px' }}
          aria-label="Return to previous page"
        >
          <ArrowLeft size={13} />
          <span>Return</span>
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--danger)',
            padding: '18px 20px',
            backgroundColor: 'var(--danger-bg)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--danger)',
            fontSize: '13.5px',
          }}
          role="alert"
        >
          <AlertCircle size={18} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: '2px' }}>Artifact Load Error</div>
            <div>{error || 'Requested artifact could not be found.'}</div>
          </div>
        </div>
      </div>
    );
  }

  const sourcesCount = Array.isArray(artifact.sources) ? artifact.sources.length : 0;
  const wordCount = typeof artifact.word_count === 'number' && artifact.word_count > 0 ? artifact.word_count : null;

  return (
    <div className="fn-home-canvas" style={{ maxWidth: '960px', padding: '32px 32px 72px' }}>
      {/* Top Editorial Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '26px',
        }}
      >
        <button
          className="fn-btn fn-btn-secondary fn-btn-sm"
          onClick={() => navigate(-1)}
          aria-label="Back to Essay Studio"
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Notification feedback indicator */}
          {feedback && (
            <div
              style={{
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: feedback.type === 'error' ? 'var(--danger-bg)' : 'var(--accent-soft)',
                color: feedback.type === 'error' ? 'var(--danger)' : 'var(--accent)',
                border: `1px solid ${feedback.type === 'error' ? 'var(--danger)' : 'var(--accent-border)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {feedback.type === 'error' ? <AlertCircle size={11} /> : <Check size={11} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--surface-secondary)',
              padding: '2px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border)',
            }}
            role="group"
            aria-label="Artifact view mode"
          >
            <button
              className={`fn-btn fn-btn-sm ${viewMode === 'preview' ? 'fn-btn-secondary' : 'fn-btn-ghost'}`}
              onClick={() => setViewMode('preview')}
              aria-pressed={viewMode === 'preview'}
              style={{ gap: '5px' }}
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
            <button
              className={`fn-btn fn-btn-sm ${viewMode === 'markdown' ? 'fn-btn-secondary' : 'fn-btn-ghost'}`}
              onClick={() => setViewMode('markdown')}
              aria-pressed={viewMode === 'markdown'}
              style={{ gap: '5px' }}
            >
              <Code size={12} />
              <span>Markdown</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            className="fn-btn fn-btn-secondary fn-btn-sm"
            onClick={handleCopy}
            title={viewMode === 'preview' ? 'Copy styled HTML publication' : 'Copy raw Markdown source'}
            aria-label="Copy artifact content"
          >
            {feedback?.type === 'success' && feedback.message.startsWith('Copied') ? (
              <Check size={12} color="var(--success)" />
            ) : (
              <Copy size={12} />
            )}
            <span>{viewMode === 'preview' ? 'Copy HTML' : 'Copy Markdown'}</span>
          </button>

          {/* Export HTML Button */}
          <button
            className="fn-btn fn-btn-primary fn-btn-sm"
            onClick={handleExport}
            title="Download complete, self-contained HTML publication for offline reading"
            aria-label="Export standalone HTML artifact"
          >
            <Download size={12} />
            <span>Export Publication</span>
          </button>
        </div>
      </div>

      {/* Prominent Editorial Header & Publication Metadata */}
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <span className="fn-badge fn-badge-accent">FIELDNOTES EDITORIAL</span>
          {artifact.topic && (
            <span className="fn-badge fn-badge-neutral">{artifact.topic.toUpperCase()}</span>
          )}
          {wordCount && (
            <span className="fn-badge fn-badge-neutral">{wordCount.toLocaleString()} WORDS</span>
          )}
          {formattedDate && (
            <span className="fn-badge fn-badge-neutral">{formattedDate.toUpperCase()}</span>
          )}
          {sourcesCount > 0 && (
            <span className="fn-badge fn-badge-neutral">{sourcesCount} SOURCES</span>
          )}
          <span
            className="fn-badge fn-badge-neutral"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title="Sanitized via DOMPurify with empty iframe sandbox"
          >
            <ShieldCheck size={11} color="var(--success)" />
            <span>Sanitized & Sandboxed</span>
          </span>
        </div>

        <h1
          className="editorial-serif"
          style={{
            fontSize: '2.45rem',
            fontWeight: 600,
            lineHeight: 1.22,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}
        >
          {artifact.title || 'Untitled Editorial Artifact'}
        </h1>
      </header>

      {/* Primary Reading / Source Viewport */}
      {viewMode === 'preview' ? (
        <div className="fn-sandbox-container">
          <iframe
            className="fn-sandbox-frame"
            title={artifact.title || 'FIELDNOTES Editorial Artifact'}
            srcDoc={previewHtml}
            sandbox=""
          />
        </div>
      ) : (
        <div className="fn-markdown-viewer">
          <div className="fn-markdown-viewer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={13} />
              <span style={{ fontWeight: 600 }}>RAW MARKDOWN SOURCE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {wordCount && <span>{wordCount.toLocaleString()} words</span>}
              <span>{(artifact.markdown || '').length.toLocaleString()} characters</span>
              <button
                className="fn-btn fn-btn-secondary fn-btn-sm"
                onClick={handleCopy}
                style={{ padding: '2px 8px', fontSize: '11px' }}
              >
                <Copy size={11} />
                <span>Copy</span>
              </button>
            </div>
          </div>
          <div className="fn-markdown-viewer-body">
            {artifact.markdown || '# No markdown source content available.'}
          </div>
        </div>
      )}
    </div>
  );
}
