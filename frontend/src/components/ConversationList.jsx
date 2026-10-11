import React, { useState } from 'react';
import { Edit2, Trash2, Check, X } from 'lucide-react';

export default function ConversationList({
  conversations = [],
  activeConversationId = null,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Group conversations into: Today, This Week, Earlier
  const groupConversations = () => {
    const today = [];
    const thisWeek = [];
    const earlier = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;

    conversations.forEach((conv) => {
      const convTime = new Date(conv.updated_at || conv.created_at).getTime();
      if (convTime >= todayStart) {
        today.push(conv);
      } else if (convTime >= sevenDaysAgo) {
        thisWeek.push(conv);
      } else {
        earlier.push(conv);
      }
    });

    return { today, thisWeek, earlier };
  };

  const { today, thisWeek, earlier } = groupConversations();

  const startEditing = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveEditing = (convId, e) => {
    e.stopPropagation();
    if (editTitle.trim() && onRenameConversation) {
      onRenameConversation(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (convId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this research inquiry?')) {
      if (onDeleteConversation) onDeleteConversation(convId);
    }
  };

  const renderGroup = (label, items) => {
    if (items.length === 0) return null;
    return (
      <div key={label} style={{ marginBottom: '10px' }}>
        <div className="fn-history-group-label">{label}</div>
        {items.map((conv) => {
          const isActive = conv.id === activeConversationId;
          const isEditing = editingId === conv.id;

          return (
            <div
              key={conv.id}
              className={`fn-history-item ${isActive ? 'active' : ''}`}
              onClick={() => !isEditing && onSelectConversation(conv.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isEditing) onSelectConversation(conv.id);
              }}
            >
              {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '4px' }}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditing(conv.id, e);
                      if (e.key === 'Escape') cancelEditing(e);
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      fontSize: '12px',
                      padding: '2px 6px',
                      border: '1px solid var(--accent)',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button className="fn-btn-icon" style={{ width: '20px', height: '20px' }} onClick={(e) => saveEditing(conv.id, e)}>
                    <Check size={11} color="var(--success)" />
                  </button>
                  <button className="fn-btn-icon" style={{ width: '20px', height: '20px' }} onClick={cancelEditing}>
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="fn-history-title" title={conv.title}>
                    {conv.title}
                  </div>
                  <div className="fn-history-actions">
                    <button
                      className="fn-btn-icon"
                      style={{ width: '20px', height: '20px' }}
                      onClick={(e) => startEditing(conv, e)}
                      title="Rename inquiry"
                      aria-label="Rename inquiry"
                    >
                      <Edit2 size={10} />
                    </button>
                    <button
                      className="fn-btn-icon"
                      style={{ width: '20px', height: '20px' }}
                      onClick={(e) => handleDelete(conv.id, e)}
                      title="Delete inquiry"
                      aria-label="Delete inquiry"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fn-history-pane">
      {renderGroup('Today', today)}
      {renderGroup('This Week', thisWeek)}
      {renderGroup('Earlier', earlier)}
      {conversations.length === 0 && (
        <div style={{ padding: '24px 8px', fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
          {'// NO PREVIOUS INQUIRIES'}
        </div>
      )}
    </div>
  );
}
