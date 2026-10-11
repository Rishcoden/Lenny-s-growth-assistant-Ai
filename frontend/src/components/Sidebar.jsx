import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Compass, Bookmark, Feather, Settings, Sun, Moon, Search } from 'lucide-react';
import ConversationList from './ConversationList';

export default function Sidebar({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onNewConversation,
  activeModelName = "Llama 3.2 (Local)",
  isBackendConnected = true,
  onOpenSettings,
  theme = 'light',
  onToggleTheme,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNewChat = () => {
    if (onNewConversation) onNewConversation();
    navigate('/');
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className={`fn-nav-rail ${isMobileOpen ? 'mobile-open' : ''}`} aria-label="Main Navigation">
      {/* Studio Header & Brand Mark */}
      <div className="fn-rail-header">
        <Link to="/" className="fn-brand-block" onClick={onCloseMobile}>
          <div className="fn-brand-mark" aria-hidden="true">
            {/* Custom geometric studio mark: minimal isometric lens/grid icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 17.5h7m-3.5-3.5v7" />
            </svg>
          </div>
          <div className="fn-brand-titles">
            <span className="fn-brand-title-main">LENNY</span>
            <span className="fn-brand-title-sub">GROWTH ASSISTANT</span>
            <span className="fn-brand-tagline">PRODUCT INTELLIGENCE STUDIO</span>
          </div>
        </Link>
      </div>

      {/* Primary Actions & Navigation */}
      <div className="fn-rail-section">
        <button
          className="fn-new-inquiry-btn"
          onClick={handleNewChat}
          aria-label="Start new research inquiry"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Plus size={14} color="var(--accent)" />
            <span>New Inquiry</span>
          </div>
          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>⌘N</span>
        </button>

        <nav>
          <Link
            to="/"
            className={`fn-nav-link ${location.pathname === '/' || location.pathname.startsWith('/c/') ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <Search size={14} />
            <span>Research</span>
          </Link>

          <Link
            to="/discover"
            className={`fn-nav-link ${location.pathname === '/discover' ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <Compass size={14} />
            <span>Discover</span>
          </Link>

          <Link
            to="/saved-insights"
            className={`fn-nav-link ${location.pathname === '/saved-insights' ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <Bookmark size={14} />
            <span>Saved Insights</span>
          </Link>

          <Link
            to="/essay-studio"
            className={`fn-nav-link ${location.pathname.startsWith('/essay-studio') ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <Feather size={14} />
            <span>Essay Studio</span>
          </Link>
        </nav>
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 14px' }} />

      {/* History List */}
      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          onSelectConversation(id);
          navigate(`/c/${id}`);
          if (onCloseMobile) onCloseMobile();
        }}
        onRenameConversation={onRenameConversation}
        onDeleteConversation={onDeleteConversation}
      />

      {/* Bottom Instrument Panel */}
      <div className="fn-rail-footer">
        <div className="fn-instrument-row">
          <div
            className="fn-model-status-chip"
            onClick={onOpenSettings}
            title="Active Model • Click to configure"
            role="button"
            tabIndex={0}
          >
            <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              <span className={`fn-status-dot ${isBackendConnected ? 'online' : 'offline'}`} />
              <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeModelName}
              </span>
            </div>
            <Settings size={12} color="var(--text-muted)" style={{ flexShrink: 0, marginLeft: '4px' }} />
          </div>

          <button
            className="fn-theme-toggle-btn"
            onClick={onToggleTheme}
            title={`Current theme: ${theme}. Click to switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label="Toggle light or dark theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={13} color="var(--accent)" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={13} color="var(--text-secondary)" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
