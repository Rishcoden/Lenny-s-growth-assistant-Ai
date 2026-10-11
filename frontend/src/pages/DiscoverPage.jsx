import React, { useState, useEffect } from 'react';
import { Search, Compass, Repeat, Activity, Target, Users, Award, ExternalLink, ArrowRight } from 'lucide-react';
import api from '../services/api';

const TOPIC_ICONS = {
  'Repeat': Repeat,
  'Activity': Activity,
  'Compass': Compass,
  'Award': Award,
  'Target': Target,
  'Users': Users,
};

export default function DiscoverPage({ onStartChat }) {
  const [topics, setTopics] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicEvidence, setTopicEvidence] = useState([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await api.getFeaturedTopics();
        if (data && data.topics) {
          setTopics(data.topics);
          if (data.topics.length > 0) {
            handleSelectTopic(data.topics[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load discover topics', err);
      }
    };
    fetchTopics();
  }, []);

  const handleSelectTopic = async (topic) => {
    setSelectedTopic(topic);
    setLoadingEvidence(true);
    try {
      const data = await api.getTopicSources(topic.title, 4);
      setTopicEvidence(data.sources || []);
    } catch (err) {
      console.error('Failed to load topic evidence', err);
      setTopicEvidence([]);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const handleLaunchQuestion = (q) => {
    if (onStartChat) {
      onStartChat(q);
    }
  };

  const filteredTopics = topics.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fn-home-canvas">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div className="fn-home-rubric">
          <span>Topic Index // Curated Knowledge</span>
        </div>
        <h1 className="fn-home-headline editorial-serif">
          Explore the ideas behind great products.
        </h1>
        <p className="fn-home-lead">
          Foundational frameworks, tactical checklists, and mental models synthesized from over 300 Lenny’s Podcast transcripts.
        </p>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xs)',
            padding: '9px 14px',
            maxWidth: '500px',
            marginTop: '16px',
          }}
        >
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Filter domains, guests, or tactical models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '13.5px' }}
          />
        </div>
      </div>

      {/* Editorial Grid of Topics */}
      <div className="fn-themes-grid" style={{ marginBottom: '40px' }}>
        {filteredTopics.map((topic) => {
          const Icon = TOPIC_ICONS[topic.icon] || Compass;
          const isSelected = selectedTopic?.id === topic.id;

          return (
            <div
              key={topic.id}
              className="fn-theme-card"
              onClick={() => handleSelectTopic(topic)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSelectTopic(topic);
              }}
              style={{
                borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--surface)',
              }}
            >
              <div className="fn-theme-card-top">
                <span className="fn-theme-title">{topic.title}</span>
                <Icon size={14} color="var(--accent)" />
              </div>
              <p className="fn-theme-desc">{topic.description}</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px' }}>
                {topic.tags.map((tag) => (
                  <span key={tag} className="fn-badge fn-badge-neutral" style={{ fontSize: '9.5px' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Topic Dossier */}
      {selectedTopic && (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xs)',
            padding: '28px',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <div style={{ marginBottom: '22px' }}>
            <span className="mono-tag" style={{ color: 'var(--accent)', marginBottom: '4px', display: 'block' }}>
              TOPIC DOSSIER //
            </span>
            <h2 className="editorial-serif" style={{ fontSize: '1.9rem', fontWeight: 600 }}>
              {selectedTopic.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              {selectedTopic.description}
            </p>
          </div>

          {/* Sample Questions */}
          <div style={{ marginBottom: '28px' }}>
            <div className="fn-editorial-section-header">
              <span className="mono-tag">Key Inquiries to Research //</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selectedTopic.sample_questions.map((q, idx) => (
                <div
                  key={idx}
                  onClick={() => handleLaunchQuestion(q)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLaunchQuestion(q);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span style={{ fontSize: '13.5px', fontWeight: 500 }}>{q}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '11.5px', fontWeight: 600 }}>
                    <span>Inquire</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Retrieved Library Evidence */}
          <div>
            <div className="fn-editorial-section-header">
              <span className="mono-tag">Supporting Library Evidence //</span>
            </div>

            {loadingEvidence ? (
              <div style={{ padding: '20px 0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span className="fn-status-dot online" style={{ animation: 'pulse 1s infinite' }} />
                <span>Retrieving podcast evidence chunks...</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                {topicEvidence.map((ev) => (
                  <div key={ev.id} className="fn-source-item" style={{ background: 'var(--surface-secondary)' }}>
                    <div className="fn-source-meta-row">
                      <span className="fn-source-citation-id">{ev.id}</span>
                      <span className="fn-badge fn-badge-neutral">{ev.guest}</span>
                    </div>
                    <div className="fn-source-title">{ev.title}</div>
                    <div className="fn-source-passage-box">"{ev.excerpt}"</div>
                    {ev.youtube_url && (
                      <a
                        href={ev.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fn-btn fn-btn-ghost fn-btn-sm"
                        style={{ padding: '2px 6px', fontSize: '11px', color: 'var(--accent)' }}
                      >
                        <span>Watch Episode</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
