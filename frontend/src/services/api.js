/**
 * Centralized API client service for Lenny Growth Assistant.
 * Connects React frontend with the FastAPI backend.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorJson = await response.json();
          if (errorJson && errorJson.detail) {
            errorDetail = typeof errorJson.detail === 'string'
              ? errorJson.detail
              : JSON.stringify(errorJson.detail);
          }
        } catch (_) {
          // Response body was not JSON
        }
        throw new Error(errorDetail);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(
          `Unable to connect to the backend server at ${this.baseUrl}. Please verify the FastAPI server is running.`
        );
      }
      throw error;
    }
  }

  // Health
  async getHealth() {
    return this.request('/api/health');
  }

  // Models
  async getModels() {
    return this.request('/api/models');
  }

  // Chat
  async sendChatMessage({ message, conversationId = null, provider = null, model = null }) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        provider,
        model,
      }),
    });
  }

  // Conversations
  async getConversations() {
    return this.request('/api/conversations');
  }

  async getConversation(conversationId) {
    return this.request(`/api/conversations/${conversationId}`);
  }

  async updateConversationTitle(conversationId, title) {
    return this.request(`/api/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  }

  async deleteConversation(conversationId) {
    return this.request(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async getConversationMessages(conversationId) {
    return this.request(`/api/conversations/${conversationId}/messages`);
  }

  // Saved Insights
  async getSavedInsights() {
    return this.request('/api/saved-insights');
  }

  async saveInsight({ title, content, sources = null, conversationId = null, topic = null }) {
    return this.request('/api/saved-insights', {
      method: 'POST',
      body: JSON.stringify({
        title,
        content,
        sources,
        conversation_id: conversationId,
        topic,
      }),
    });
  }

  async deleteSavedInsight(insightId) {
    return this.request(`/api/saved-insights/${insightId}`, {
      method: 'DELETE',
    });
  }

  // Essays & Artifacts
  async generateEssay({ topic, centralQuestion, audience = null, tone = null, provider = null, model = null }) {
    return this.request('/api/essays', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        central_question: centralQuestion,
        audience,
        tone,
        provider,
        model,
      }),
    });
  }

  async getEssay(essayId) {
    return this.request(`/api/essays/${essayId}`);
  }

  async getArtifact(artifactId) {
    return this.request(`/api/artifacts/${artifactId}`);
  }

  // Discover
  async getFeaturedTopics() {
    return this.request('/api/discover/topics');
  }

  async getTopicSources(topic, limit = 4) {
    return this.request(`/api/discover/topic-sources?topic=${encodeURIComponent(topic)}&limit=${limit}`);
  }
}

export const api = new ApiService();
export default api;
