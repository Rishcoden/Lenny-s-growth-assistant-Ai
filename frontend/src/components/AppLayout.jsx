import React, { useState } from 'react';
import { Menu, Layers } from 'lucide-react';
import Sidebar from './Sidebar';
import SourcePanel from './SourcePanel';

export default function AppLayout({
  children,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onNewConversation,
  activeModelName,
  isBackendConnected,
  onOpenSettings,
  theme,
  onToggleTheme,
  // Source panel props
  sources = [],
  activeCitationId,
  onSelectCitation,
  isSourcePanelOpen,
  setIsSourcePanelOpen,
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="fieldnotes-app">
      {/* 1. Navigation Rail */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onRenameConversation={onRenameConversation}
        onDeleteConversation={onDeleteConversation}
        onNewConversation={onNewConversation}
        activeModelName={activeModelName}
        isBackendConnected={isBackendConnected}
        onOpenSettings={onOpenSettings}
        theme={theme}
        onToggleTheme={onToggleTheme}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Research Canvas Column */}
      <main className="research-canvas-column">
        <header className="canvas-header">
          <div className="canvas-header-left">
            <button
              className="fn-btn-icon mobile-nav-toggle"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              aria-label="Toggle navigation drawer"
            >
              <Menu size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="mono-tag" style={{ color: 'var(--accent)' }}>STUDIO //</span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>FIELDNOTES</span>
            </div>
          </div>

          <div className="canvas-header-right">
            {sources.length > 0 && (
              <button
                className={`fn-btn fn-btn-sm ${isSourcePanelOpen ? 'fn-btn-primary' : 'fn-btn-secondary'}`}
                onClick={() => setIsSourcePanelOpen(!isSourcePanelOpen)}
                title="Toggle evidence inspector"
                aria-label="Toggle evidence inspector"
              >
                <Layers size={13} />
                <span>Evidence ({sources.length})</span>
              </button>
            )}
          </div>
        </header>

        <div className="canvas-viewport">
          {children}
        </div>
      </main>

      {/* 3. Evidence Inspector */}
      <SourcePanel
        sources={sources}
        activeCitationId={activeCitationId}
        isOpen={isSourcePanelOpen}
        onClose={() => setIsSourcePanelOpen(false)}
        onSelectCitation={onSelectCitation}
      />
    </div>
  );
}
