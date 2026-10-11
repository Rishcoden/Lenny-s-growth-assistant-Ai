import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatMessage from '../components/ChatMessage';
import ChatComposer from '../components/ChatComposer';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import api from '../services/api';

export default function ChatPage({
  activeConversationId,
  onSourcesLoaded,
  activeCitationId,
  onCitationClick,
  activeProvider,
  activeModel,
}) {
  const { id } = useParams();
  const conversationId = id || activeConversationId;
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [composerText, setComposerText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load conversation details & messages from backend
  useEffect(() => {
    if (!conversationId) return;

    let isMounted = true;
    const fetchConversation = async () => {
      try {
        setError(null);
        const data = await api.getConversation(conversationId);
        if (isMounted) {
          setConversation(data);
          setMessages(data.messages || []);
          const lastAsst = [...(data.messages || [])].reverse().find(
            (m) => m.role === 'assistant' && m.sources && m.sources.length > 0
          );
          if (lastAsst && onSourcesLoaded) {
            onSourcesLoaded(lastAsst.sources);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      }
    };

    fetchConversation();
    return () => {
      isMounted = false;
    };
  }, [conversationId, onSourcesLoaded]);

  const handleSendMessage = async () => {
    const text = composerText.trim();
    if (!text || isLoading) return;

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setComposerText('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.sendChatMessage({
        message: text,
        conversationId: conversationId || null,
        provider: activeProvider,
        model: activeModel,
      });

      const asstMsg = {
        id: response.message_id,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        created_at: response.created_at,
      };

      setMessages((prev) => [...prev, asstMsg]);

      if (response.sources && response.sources.length > 0 && onSourcesLoaded) {
        onSourcesLoaded(response.sources);
      }

      if (!conversationId && response.conversation_id) {
        navigate(`/c/${response.conversation_id}`, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInsight = async (message) => {
    try {
      const title = message.content.split('\n')[0].replace(/^[#\s*]+/, '').slice(0, 80) || "Podcast Insight";
      await api.saveInsight({
        title,
        content: message.content,
        sources: message.sources,
        conversationId,
        topic: "General Growth",
      });
      alert('Insight saved to your research notebook!');
    } catch (err) {
      alert(`Could not save insight: ${err.message}`);
    }
  };

  return (
    <div className="fn-conversation-workspace">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
        {/* Thread Document Subheader */}
        <div
          style={{
            padding: '10px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <span className="mono-tag" style={{ color: 'var(--text-muted)' }}>DOCUMENT //</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {conversation?.title || "Active Inquiry"}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="fn-badge fn-badge-neutral" style={{ fontSize: '10px' }}>
              {activeModel || 'llama3.2'}
            </span>
          </div>
        </div>

        {/* Message Thread Scroll Area */}
        <div className="fn-thread-scrollable">
          <div className="fn-thread-inner">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                activeCitationId={activeCitationId}
                onCitationClick={onCitationClick}
                onSaveInsight={handleSaveInsight}
                onOpenSources={onSourcesLoaded}
              />
            ))}

            {isLoading && <LoadingState />}
            {error && <ErrorState message={error} onRetry={handleSendMessage} />}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Follow-up Composer */}
        <div className="fn-bottom-composer-wrapper">
          <div className="fn-bottom-composer-inner">
            <ChatComposer
              value={composerText}
              onChange={setComposerText}
              onSubmit={handleSendMessage}
              isLoading={isLoading}
              placeholder="Ask a follow-up inquiry grounded in Lenny's Podcast transcripts..."
              label="INQUIRE FURTHER"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
