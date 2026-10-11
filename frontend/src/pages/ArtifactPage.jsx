import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Download, ShieldCheck, Code, Eye } from 'lucide-react';
import DOMPurify from 'dompurify';
import api from '../services/api';

export default function ArtifactPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [artifact, setArtifact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'markdown'
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchArtifact = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getArtifact(id);
        setArtifact(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArtifact();
  }, [id]);

  const handleCopy = () => {
    if (!artifact) return;
    const content = viewMode === 'preview' ? artifact.html : artifact.markdown;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!artifact) return;
    const isMarkdown = viewMode === 'markdown';
    const blob = new Blob([isMarkdown ? artifact.markdown : artifact.html], {
      type: isMarkdown ? 'text/markdown' : 'text/html',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '_').toLowerCase()}.${isMarkdown ? 'md' : 'html'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build sanitized HTML document for the sandboxed iframe with theme awareness
  const buildSanitizedFrameContent = (rawHtml) => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
    });

    const bg = isDark ? '#1C201B' : '#FFFFFF';
    const textColor = isDark ? '#F0F0E9' : '#20231F';
    const border = isDark ? '#343A30' : '#DEDCD2';
    const codeBg = isDark ? '#20251E' : '#EAE9E1';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              font-size: 15px;
              line-height: 1.7;
              color: ${textColor};
              background-color: ${bg};
              max-width: 760px;
              margin: 0 auto;
              padding: 36px 20px;
            }
            h1, h2, h3, h4 {
              font-family: Georgia, serif;
              color: ${textColor};
              line-height: 1.3;
              margin-top: 1.5em;
              margin-bottom: 0.55em;
            }
            h1 { font-size: 2.1rem; }
            h2 { font-size: 1.5rem; border-bottom: 1px solid ${border}; padding-bottom: 6px; }
            p { margin-bottom: 1.2em; }
            ul, ol { margin-left: 1.4em; margin-bottom: 1.2em; }
            li { margin-bottom: 0.35em; }
            blockquote {
              border-left: 2px solid #526A46;
              padding: 6px 14px;
              margin: 1.3em 0;
              font-style: italic;
              color: #777;
            }
            code {
              font-family: monospace;
              font-size: 13px;
              background: ${codeBg};
              padding: 2px 5px;
              border-radius: 3px;
            }
          </style>
        </head>
        <body>
          ${cleanHtml}
        </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="fn-home-canvas" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <span className="fn-status-dot online" style={{ animation: 'pulse 1s infinite' }} />
        <span>Loading editorial artifact...</span>
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="fn-home-canvas">
        <button className="fn-btn fn-btn-secondary fn-btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }}>
          <ArrowLeft size={13} />
          <span>Go Back</span>
        </button>
        <div style={{ color: 'var(--danger)', padding: '16px', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-xs)' }}>
          {error || 'Artifact not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="fn-home-canvas" style={{ maxWidth: '920px' }}>
      {/* Top Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <button className="fn-btn fn-btn-secondary fn-btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--surface-secondary)', padding: '2px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
            <button
              className={`fn-btn fn-btn-sm ${viewMode === 'preview' ? 'fn-btn-secondary' : 'fn-btn-ghost'}`}
              onClick={() => setViewMode('preview')}
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
            <button
              className={`fn-btn fn-btn-sm ${viewMode === 'markdown' ? 'fn-btn-secondary' : 'fn-btn-ghost'}`}
              onClick={() => setViewMode('markdown')}
            >
              <Code size={12} />
              <span>Markdown</span>
            </button>
          </div>

          <button className="fn-btn fn-btn-secondary fn-btn-sm" onClick={handleCopy}>
            {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button className="fn-btn fn-btn-secondary fn-btn-sm" onClick={handleDownload}>
            <Download size={12} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Artifact Metadata */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <span className="fn-badge fn-badge-accent">EDITORIAL ARTIFACT</span>
          <span className="fn-badge fn-badge-neutral">{artifact.word_count} WORDS</span>
          <span className="fn-badge fn-badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={10} color="var(--success)" />
            <span>DOMPurify Sanitized</span>
          </span>
        </div>
        <h1 className="editorial-serif" style={{ fontSize: '2.3rem', fontWeight: 600 }}>
          {artifact.title}
        </h1>
      </div>

      {/* Viewer View */}
      {viewMode === 'preview' ? (
        <div className="fn-sandbox-container">
          <iframe
            className="fn-sandbox-frame"
            title={artifact.title}
            srcDoc={buildSanitizedFrameContent(artifact.html)}
            sandbox="allow-same-origin"
          />
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--code-bg)',
            color: 'var(--text-primary)',
            padding: '24px',
            borderRadius: 'var(--radius-xs)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12.5px',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            maxHeight: '750px',
            overflowY: 'auto',
            border: '1px solid var(--border)',
          }}
        >
          {artifact.markdown}
        </div>
      )}
    </div>
  );
}
