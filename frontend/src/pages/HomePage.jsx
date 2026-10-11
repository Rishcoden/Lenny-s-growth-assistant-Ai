import React, { useState } from 'react';
import { ArrowRight, Compass, Repeat, Activity, Target, Users, Award } from 'lucide-react';
import ChatComposer from '../components/ChatComposer';

const EDITORIAL_QUESTIONS = [
  {
    index: "01",
    question: "Why do users stop returning after signup?",
  },
  {
    index: "02",
    question: "What makes product-market fit recognizable?",
  },
  {
    index: "03",
    question: "How do great teams decide what not to build?",
  },
  {
    index: "04",
    question: "Where should an early-stage startup find growth?",
  },
  {
    index: "05",
    question: "What separates a useful product metric from a vanity metric?",
  },
];

const THEMES = [
  {
    title: "Growth",
    desc: "Acquisition loops, self-serve funnels, and product-led growth mechanics.",
    icon: Repeat,
    query: "What makes product-led growth loops compound over time according to Lenny's guests?",
  },
  {
    title: "Retention",
    desc: "Cohorts, early drop-off, habit activation, and bending the curve.",
    icon: Activity,
    query: "Why do users abandon products after signup, and how do you improve 30-day retention?",
  },
  {
    title: "Product Strategy",
    desc: "Hard trade-offs, roadmap sequencing, positioning, and saying no.",
    icon: Compass,
    query: "What frameworks do top product leaders use to formulate clear, differentiated strategy?",
  },
  {
    title: "Leadership",
    desc: "Executive presence, influencing without authority, and cross-functional momentum.",
    icon: Award,
    query: "What separates good product managers from great ones in executive leadership?",
  },
  {
    title: "Product-Market Fit",
    desc: "Recognizing organic pull, Sean Ellis test benchmarks, and pivoting tactics.",
    icon: Target,
    query: "How do early-stage founders know when they have achieved real product-market fit?",
  },
  {
    title: "Hiring & Teams",
    desc: "Building high-agency pods, hiring first PMs, and scaling org structure.",
    icon: Users,
    query: "How do the best product companies structure and hire their product and growth teams?",
  },
];

export default function HomePage({ onStartChat, isLoading = false }) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (overrideText = null) => {
    const textToSubmit = overrideText || question;
    if (!textToSubmit.trim()) return;
    onStartChat(textToSubmit.trim());
  };

  return (
    <div className="fn-home-canvas">
      {/* Editorial Header */}
      <div>
        <div className="fn-home-rubric">
          <span>Fieldnotes / Product Research</span>
        </div>

        <h1 className="fn-home-headline editorial-serif">
          Build products people come back to.
        </h1>

        <p className="fn-home-lead">
          Explore the thinking behind better products, stronger growth, and teams that consistently deliver—grounded in verbatim transcripts from Lenny’s Podcast.
        </p>
      </div>

      {/* Prominent Editorial Composer */}
      <ChatComposer
        value={question}
        onChange={setQuestion}
        onSubmit={() => handleSubmit()}
        isLoading={isLoading}
        placeholder="Inquire on retention curves, PM hiring, PMF benchmarks, or viral growth loops..."
        label="ASK THE LIBRARY"
      />

      {/* Staggered Editorial Questions Section */}
      <section style={{ marginTop: '36px' }}>
        <div className="fn-editorial-section-header">
          <span className="mono-tag">Questions Worth Exploring //</span>
          <span className="technical-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            CURATED INQUIRIES
          </span>
        </div>

        <div className="fn-questions-list">
          {EDITORIAL_QUESTIONS.map((item) => (
            <button
              key={item.index}
              className="fn-question-row"
              onClick={() => handleSubmit(item.question)}
              aria-label={`Ask inquiry: ${item.question}`}
            >
              <span className="fn-question-index">{item.index} /</span>
              <span className="fn-question-text">{item.question}</span>
              <ArrowRight size={14} className="fn-question-arrow" />
            </button>
          ))}
        </div>
      </section>

      {/* Themes Grid */}
      <section style={{ marginTop: '20px' }}>
        <div className="fn-editorial-section-header">
          <span className="mono-tag">Explore by Theme //</span>
          <span className="technical-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            6 FOUNDATIONAL DOMAINS
          </span>
        </div>

        <div className="fn-themes-grid">
          {THEMES.map((theme) => {
            const Icon = theme.icon;
            return (
              <div
                key={theme.title}
                className="fn-theme-card"
                onClick={() => handleSubmit(theme.query)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit(theme.query);
                }}
              >
                <div className="fn-theme-card-top">
                  <span className="fn-theme-title">{theme.title}</span>
                  <Icon size={14} color="var(--accent)" />
                </div>
                <p className="fn-theme-desc">{theme.desc}</p>
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--accent)', fontWeight: 600 }}>
                  <span>Inquire</span>
                  <ArrowRight size={11} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
