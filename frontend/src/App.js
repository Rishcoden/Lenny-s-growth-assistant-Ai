import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import DiscoverPage from './pages/DiscoverPage';
import SavedInsightsPage from './pages/SavedInsightsPage';
import EssayStudioPage from './pages/EssayStudioPage';
import ArtifactPage from './pages/ArtifactPage';
import ModelSelectorModal from './components/ModelSelectorModal';
import useTheme from './hooks/useTheme';
import api from './services/api';
import './styles/global.css';
import './styles/components.css';

function MainApplication() {
  const { theme, toggleTheme } = useTheme();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('ollama/llama3.2');
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  // Evidence inspector state
  const [sources, setSources] = useState([]);
  const [activeCitationId, setActiveCitationId] = useState(null);
  const [isSourcePanelOpen, setIsSourcePanelOpen] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const navigate = useNavigate();

  // Load conversations & health
  const refreshConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
      setIsBackendConnected(true);
    } catch (err) {
      console.warn('Backend not reachable:', err.message);
      setIsBackendConnected(false);
    }
  }, []);

  const refreshModels = useCallback(async () => {
    try {
      const data = await api.getModels();
      if (data && data.models) {
        setModels(data.models);
        const defaultModel = data.models.find((m) => m.is_default);
        if (defaultModel) {
          setSelectedModelId(defaultModel.id);
        }
      }
    } catch (err) {
      console.warn('Models endpoint error:', err.message);
    }
  }, []);

  useEffect(() => {
    refreshConversations();
    refreshModels();
  }, [refreshConversations, refreshModels]);

  const activeModelObj = models.find((m) => m.id === selectedModelId) || {
    name: 'Llama 3.2 (Local)',
    provider: 'ollama',
  };

  const activeProvider = activeModelObj.provider || 'ollama';
  const activeModelNameOnly = activeModelObj.id ? activeModelObj.id.split('/')[1] : 'llama3.2';

  // Handle starting a new chat inquiry from Home or Discover
  const handleStartChat = async (question) => {
    setIsStartingChat(true);
    try {
      const response = await api.sendChatMessage({
        message: question,
        provider: activeProvider,
        model: activeModelNameOnly,
      });

      setSources(response.sources || []);
      if (response.sources && response.sources.length > 0) {
        setIsSourcePanelOpen(true);
      }

      await refreshConversations();
      setActiveConversationId(response.conversation_id);
      navigate(`/c/${response.conversation_id}`);
    } catch (err) {
      alert(`Could not start inquiry: ${err.message}`);
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleRenameConversation = async (id, newTitle) => {
    try {
      await api.updateConversationTitle(id, newTitle);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      );
    } catch (err) {
      alert(`Failed to rename inquiry: ${err.message}`);
    }
  };

  const handleDeleteConversation = async (id) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        navigate('/');
      }
    } catch (err) {
      alert(`Failed to delete inquiry: ${err.message}`);
    }
  };

  const handleCitationClick = (citationId) => {
    setActiveCitationId(citationId);
    setIsSourcePanelOpen(true);
  };

  const handleSourcesLoaded = useCallback((newSources) => {
    setSources(newSources);
  }, []);

  return (
    <AppLayout
      conversations={conversations}
      activeConversationId={activeConversationId}
      onSelectConversation={(id) => setActiveConversationId(id)}
      onRenameConversation={handleRenameConversation}
      onDeleteConversation={handleDeleteConversation}
      onNewConversation={() => {
        setActiveConversationId(null);
        setSources([]);
      }}
      activeModelName={activeModelObj.name}
      isBackendConnected={isBackendConnected}
      onOpenSettings={() => setIsModelModalOpen(true)}
      theme={theme}
      onToggleTheme={toggleTheme}
      // Evidence inspector
      sources={sources}
      activeCitationId={activeCitationId}
      onSelectCitation={(id) => setActiveCitationId(id)}
      isSourcePanelOpen={isSourcePanelOpen}
      setIsSourcePanelOpen={setIsSourcePanelOpen}
    >
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onStartChat={handleStartChat}
              isLoading={isStartingChat}
            />
          }
        />
        <Route
          path="/c/:id"
          element={
            <ChatPage
              activeConversationId={activeConversationId}
              onSourcesLoaded={handleSourcesLoaded}
              activeCitationId={activeCitationId}
              onCitationClick={handleCitationClick}
              activeProvider={activeProvider}
              activeModel={activeModelNameOnly}
            />
          }
        />
        <Route
          path="/discover"
          element={<DiscoverPage onStartChat={handleStartChat} />}
        />
        <Route
          path="/saved-insights"
          element={<SavedInsightsPage />}
        />
        <Route
          path="/essay-studio"
          element={
            <EssayStudioPage
              activeProvider={activeProvider}
              activeModel={activeModelNameOnly}
            />
          }
        />
        <Route
          path="/artifacts/:id"
          element={<ArtifactPage />}
        />
      </Routes>

      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        models={models}
        selectedModelId={selectedModelId}
        onSelectModel={(id) => setSelectedModelId(id)}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainApplication />
    </BrowserRouter>
  );
}
