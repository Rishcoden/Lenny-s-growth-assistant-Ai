import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ArtifactPage from './ArtifactPage';
import api from '../services/api';
import * as artifactDocument from '../utils/artifactDocument';

jest.mock('../services/api');

const mockArtifactData = {
  artifact_id: 'test-artifact-123',
  title: 'The Principles of Product-Led Growth',
  topic: 'Growth Loops',
  word_count: 1280,
  created_at: '2026-10-12T10:30:00Z',
  markdown: '# The Principles of Product-Led Growth\n\nSelf-serve activation is the bedrock.',
  html: '<h1>The Principles of Product-Led Growth</h1><p>Self-serve activation is the bedrock.</p>',
  sources: [
    {
      id: 'S1',
      guest: 'Elena Verna',
      title: 'PLG Loops',
      excerpt: 'Retention is oxygen.',
      youtube_url: 'https://youtube.com/watch?v=mock'
    }
  ]
};

describe('ArtifactPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (id = 'test-artifact-123') => {
    return render(
      <MemoryRouter initialEntries={[`/artifacts/${id}`]}>
        <Routes>
          <Route path="/artifacts/:id" element={<ArtifactPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  test('displays loading indicator initially', () => {
    api.getArtifact.mockReturnValue(new Promise(() => {})); // Never resolves
    renderComponent();
    expect(screen.getByText(/Loading FIELDNOTES editorial artifact.../i)).toBeInTheDocument();
  });

  test('displays error message when artifact fetch fails', async () => {
    api.getArtifact.mockRejectedValue(new Error('Artifact not found or server error'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Artifact not found or server error/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Return/i)).toBeInTheDocument();
  });

  test('renders publication header and metadata badges correctly', async () => {
    api.getArtifact.mockResolvedValue(mockArtifactData);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('The Principles of Product-Led Growth')).toBeInTheDocument();
    });

    expect(screen.getByText('FIELDNOTES EDITORIAL')).toBeInTheDocument();
    expect(screen.getByText('GROWTH LOOPS')).toBeInTheDocument();
    expect(screen.getByText('1,280 WORDS')).toBeInTheDocument();
    expect(screen.getByText('1 SOURCES')).toBeInTheDocument();
    expect(screen.getByText(/Sanitized & Sandboxed/i)).toBeInTheDocument();
  });

  test('renders iframe with strict empty sandbox attribute (sandbox="") and no unsafe permissions', async () => {
    api.getArtifact.mockResolvedValue(mockArtifactData);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTitle('The Principles of Product-Led Growth')).toBeInTheDocument();
    });

    const iframe = screen.getByTitle('The Principles of Product-Led Growth');
    expect(iframe).toBeInTheDocument();
    expect(iframe.tagName).toBe('IFRAME');

    // Strict security assertions
    expect(iframe.getAttribute('sandbox')).toBe('');
    expect(iframe.getAttribute('sandbox')).not.toContain('allow-same-origin');
    expect(iframe.getAttribute('sandbox')).not.toContain('allow-scripts');

    // Content assertion
    expect(iframe.getAttribute('srcDoc')).toContain('<!DOCTYPE html>');
    expect(iframe.getAttribute('srcDoc')).toContain('Self-serve activation is the bedrock.');
  });

  test('toggles seamlessly between Preview and Markdown modes', async () => {
    api.getArtifact.mockResolvedValue(mockArtifactData);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTitle('The Principles of Product-Led Growth')).toBeInTheDocument();
    });

    // Switch to Markdown mode
    const markdownBtn = screen.getByRole('button', { name: /Markdown/i });
    fireEvent.click(markdownBtn);

    // Iframe should no longer be rendered
    expect(screen.queryByTitle('The Principles of Product-Led Growth')).not.toBeInTheDocument();

    // Raw markdown source view should be displayed
    expect(screen.getByText(/RAW MARKDOWN SOURCE/i)).toBeInTheDocument();
    expect(screen.getByText(/# The Principles of Product-Led Growth/i)).toBeInTheDocument();

    // Switch back to Preview mode
    const previewBtn = screen.getByRole('button', { name: /Preview/i });
    fireEvent.click(previewBtn);

    // Iframe returns intact
    expect(screen.getByTitle('The Principles of Product-Led Growth')).toBeInTheDocument();
  });

  test('copies artifact content with visual feedback', async () => {
    api.getArtifact.mockResolvedValue(mockArtifactData);
    const writeTextMock = jest.fn().mockResolvedValue();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('The Principles of Product-Led Growth')).toBeInTheDocument();
    });

    // In Preview mode: "Copy HTML"
    const copyBtn = screen.getByRole('button', { name: /Copy artifact content/i });
    expect(copyBtn).toHaveTextContent('Copy HTML');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
      expect(screen.getByText('Editorial HTML copied')).toBeInTheDocument();
    });

    // In Markdown mode: "Copy Markdown"
    const markdownBtn = screen.getByRole('button', { name: /Markdown/i });
    fireEvent.click(markdownBtn);

    expect(copyBtn).toHaveTextContent('Copy Markdown');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(mockArtifactData.markdown);
      expect(screen.getByText('Markdown copied')).toBeInTheDocument();
    });
  });

  test('triggers HTML export via exportArtifactAsHtml', async () => {
    api.getArtifact.mockResolvedValue(mockArtifactData);
    const exportSpy = jest.spyOn(artifactDocument, 'exportArtifactAsHtml').mockImplementation(() => {});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('The Principles of Product-Led Growth')).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: /Export standalone HTML artifact/i });
    fireEvent.click(exportBtn);

    expect(exportSpy).toHaveBeenCalledWith(mockArtifactData);
    expect(screen.getByText('HTML publication downloaded')).toBeInTheDocument();

    exportSpy.mockRestore();
  });
});
