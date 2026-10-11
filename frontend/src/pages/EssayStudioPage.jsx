import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Feather, BookOpen, Copy, Check, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';

export default function EssayStudioPage({ activeProvider, activeModel }) {
  const [topic, setTopic] = useState('Growth Loops & Compounding Scale');
  const [centralQuestion, setCentralQuestion] = useState(
    'Why do compounding product growth loops outperform traditional linear acquisition funnels, and what are the specific failure modes product teams encounter?'
  );
  const [audience, setAudience] = useState('Product managers, founders, and growth leaders');
  const [tone, setTone] = useState('Editorial, analytical, pragmatic');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedEssay, setGeneratedEssay] = useState(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim() || !centralQuestion.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.generateEssay({
        topic: topic.trim(),
        centralQuestion: centralQuestion.trim(),
        audience: audience.trim(),
        tone: tone.trim(),
        provider: activeProvider,
        model: activeModel,
      });

      setGeneratedEssay(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedEssay) return;
    navigator.clipboard.writeText(generatedEssay.content_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fn-studio-container">
      {/* Studio Header */}
      <div style={{ marginBottom: '32px' }}>
        <div className="fn-home-rubric">
          <span>Writing Desk // Long-Form Synthesis</span>
        </div>
        <h1 className="fn-home-headline editorial-serif">
          Essay Studio
        </h1>
        <p className="fn-home-lead">
          Turn research into a considered point of view. Generate grounded, publication-grade editorial essays (~1,250 words) synthesizing deep wisdom across Lenny's Podcast archives.
        </p>
      </div>

      {/* Stage 1: Compact Configuration Area */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xs)',
          padding: '24px 28px',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: '36px',
        }}
      >
        <form onSubmit={handleGenerate}>
          <div className="fn-form-row">
            <label className="fn-form-label">Essay Topic</label>
            <input
              type="text"
              className="fn-form-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The Architecture of Product-Led Sales"
              required
            />
          </div>

          <div className="fn-form-row">
            <label className="fn-form-label">Central Question or Thesis</label>
            <textarea
              className="fn-form-textarea"
              rows={3}
              value={centralQuestion}
              onChange={(e) => setCentralQuestion(e.target.value)}
              placeholder="What core thesis or inquiry should the essay explore and resolve?"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="fn-form-row">
              <label className="fn-form-label">Target Audience</label>
              <input
                type="text"
                className="fn-form-input"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Audience profile"
              />
            </div>

            <div className="fn-form-row">
              <label className="fn-form-label">Editorial Tone</label>
              <input
                type="text"
                className="fn-form-input"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Voice and style"
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
            <div className="technical-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              TARGET ~1,250 WORDS // MULTI-CHUNK RETRIEVAL
            </div>

            <button
              type="submit"
              className="fn-btn fn-btn-primary"
              disabled={isLoading || !topic.trim() || !centralQuestion.trim()}
              style={{ padding: '8px 16px' }}
            >
              {isLoading ? (
                <>
                  <span className="fn-status-dot online" style={{ animation: 'pulse 1s infinite' }} />
                  <span>Drafting Essay (~20s)...</span>
                </>
              ) : (
                <>
                  <span>Draft Editorial Essay</span>
                  <Feather size={13} />
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-xs)', fontSize: '12.5px' }}>
            {error}
          </div>
        )}
      </div>

      {/* Stage 2: Reading Workspace Sheet */}
      {generatedEssay && (
        <article className="fn-paper-sheet">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="fn-badge fn-badge-accent">EDITORIAL ESSAY</span>
              <span className="fn-badge fn-badge-neutral">{generatedEssay.word_count} WORDS</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="fn-btn fn-btn-secondary fn-btn-sm" onClick={handleCopy}>
                {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                className="fn-btn fn-btn-primary fn-btn-sm"
                onClick={() => navigate(`/artifacts/${generatedEssay.id}`)}
              >
                <BookOpen size={12} />
                <span>Open Artifact View</span>
              </button>
            </div>
          </div>

          <div className="editorial-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {generatedEssay.content_markdown}
            </ReactMarkdown>
          </div>

          {generatedEssay.sources && generatedEssay.sources.length > 0 && (
            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <h4 className="editorial-serif" style={{ fontSize: '1.25rem', marginBottom: '14px' }}>
                Supporting Transcript Evidence
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {generatedEssay.sources.map((src) => (
                  <div key={src.id} className="fn-source-item" style={{ background: 'var(--surface-secondary)' }}>
                    <div className="fn-source-meta-row">
                      <span className="fn-source-citation-id">{src.id}</span>
                      <span className="fn-badge fn-badge-neutral">{src.guest}</span>
                    </div>
                    <div className="fn-source-title">{src.title}</div>
                    <div className="fn-source-passage-box">"{src.excerpt}"</div>
                    {src.youtube_url && (
                      <a href={src.youtube_url} target="_blank" rel="noopener noreferrer" className="fn-btn fn-btn-ghost fn-btn-sm" style={{ padding: '2px 4px', fontSize: '10.5px' }}>
                        <span>Episode</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
