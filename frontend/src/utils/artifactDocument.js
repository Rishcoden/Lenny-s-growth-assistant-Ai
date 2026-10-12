/**
 * FIELDNOTES Editorial Artifact Document & Sanitization Engine
 * 
 * Generates publication-grade, self-contained editorial HTML documents
 * for both the in-app sandboxed iframe viewer and standalone offline export.
 * Enforces strict DOMPurify sanitization and zero-trust security policies.
 */

import DOMPurify from 'dompurify';

/**
 * Strict DOMPurify sanitization policy for untrusted LLM-generated HTML.
 * - Allows only safe semantic formatting tags.
 * - Forbids active content: scripts, iframes, objects, forms, styles, embeds.
 * - Strips all event-handlers (onclick, onerror, onload, etc.).
 * - Validates URLs, forbidding javascript: and data: schemes.
 * - Forces safe external link attributes (target="_blank", rel="noopener noreferrer").
 */
export function sanitizeArtifactHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return '';
  }

  // Create isolated DOMPurify instance hook for link hardening
  const purifyHook = (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      // Strip dangerous schemes
      if (/^\s*(javascript|data|vbscript):/i.test(href)) {
        node.removeAttribute('href');
      } else {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
  };

  DOMPurify.addHook('afterSanitizeAttributes', purifyHook);

  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'blockquote', 'hr',
      'ul', 'ol', 'li',
      'strong', 'b', 'em', 'i', 'u', 's', 'del', 'sub', 'sup',
      'a', 'code', 'pre',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'span', 'div', 'br', 'abbr', 'cite', 'section', 'article', 'header', 'footer'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel', 'class', 'id',
      'colspan', 'rowspan', 'scope', 'aria-label', 'aria-hidden'
    ],
    FORBID_TAGS: [
      'script', 'iframe', 'object', 'embed', 'form', 'input',
      'button', 'select', 'textarea', 'link', 'style', 'base',
      'meta', 'applet', 'svg', 'canvas'
    ],
    FORBID_ATTR: ['style'],
    ALLOW_DATA_ATTR: false,
  });

  DOMPurify.removeHook('afterSanitizeAttributes');

  // Enhance inline citation markers like [S1], [S2] with styled pills safely
  return cleanHtml.replace(/\[(S\d+)\]/g, '<span class="fn-citation-pill">$1</span>');
}

/**
 * Shared publication stylesheet ensuring visual identity parity
 * between the in-app sandboxed preview and standalone exported HTML.
 */
export function buildEditorialStylesheet({ isDark = false, forExport = false } = {}) {
  // Editorial palette definition
  const palette = (isDark && !forExport) ? {
    bodyBg: '#151714',
    sheetBg: '#1C201B',
    sheetBorder: '#343A30',
    sheetShadow: '0 2px 14px rgba(0, 0, 0, 0.4)',
    textPrimary: '#F0F0E9',
    textSecondary: '#A0A69A',
    textMuted: '#6B7265',
    accent: '#A9C493',
    accentSoft: '#242F20',
    accentBorder: '#485741',
    highlight: '#E39A76',
    border: '#343A30',
    borderSubtle: '#282E25',
    codeBg: '#222820',
    codeBorder: '#333A2F',
    tableHeaderBg: '#252A23',
    tableBorder: '#343A30',
    citationBg: '#2A3626',
    citationText: '#C4E0AF',
    colorScheme: 'dark',
  } : {
    bodyBg: '#F5F4EF',
    sheetBg: '#FFFFFF',
    sheetBorder: '#DEDCD2',
    sheetShadow: '0 2px 12px rgba(32, 35, 31, 0.05)',
    textPrimary: '#20231F',
    textSecondary: '#63675E',
    textMuted: '#8E9287',
    accent: '#526A46',
    accentSoft: '#EEF4EA',
    accentBorder: '#9CB890',
    highlight: '#C96F4A',
    border: '#DEDCD2',
    borderSubtle: '#ECEAE1',
    codeBg: '#EFEFEA',
    codeBorder: '#DCD9CE',
    tableHeaderBg: '#F3F2EC',
    tableBorder: '#E0DED4',
    citationBg: '#E6EFE1',
    citationText: '#425837',
    colorScheme: 'light',
  };

  const containerPadding = forExport ? '56px 52px' : '44px 36px';

  return `
    :root {
      color-scheme: ${palette.colorScheme};
      --font-serif: 'Newsreader', 'Instrument Serif', 'Charter', 'Bitstream Charter', 'Cambria', Georgia, serif;
      --font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      --font-mono: 'IBM Plex Mono', 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      font-size: 16px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: ${palette.bodyBg};
    }

    body {
      background-color: ${palette.bodyBg};
      color: ${palette.textPrimary};
      font-family: var(--font-sans);
      font-size: 16px;
      line-height: 1.75;
      padding: ${forExport ? '48px 20px 80px' : '28px 16px 64px'};
    }

    .fn-publication-wrapper {
      max-width: 820px;
      margin: 0 auto;
    }

    .fn-publication-sheet {
      background-color: ${palette.sheetBg};
      border: 1px solid ${palette.sheetBorder};
      border-radius: 4px;
      box-shadow: ${palette.sheetShadow};
      padding: ${containerPadding};
    }

    /* Masthead & Document Rubric */
    .fn-pub-masthead {
      border-bottom: 2px solid ${palette.accent};
      padding-bottom: 24px;
      margin-bottom: 36px;
    }

    .fn-pub-rubric {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: ${palette.accent};
      margin-bottom: 16px;
    }

    .fn-pub-rubric-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .fn-pub-rubric-badge {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 9999px;
      background-color: ${palette.accent};
    }

    .fn-pub-title {
      font-family: var(--font-serif);
      font-size: 2.35rem;
      font-weight: 600;
      line-height: 1.22;
      color: ${palette.textPrimary};
      letter-spacing: -0.02em;
      margin-bottom: 14px;
    }

    .fn-pub-meta-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 14px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: ${palette.textSecondary};
      margin-top: 14px;
    }

    .fn-pub-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 3px;
      background-color: ${palette.accentSoft};
      color: ${palette.accent};
      border: 1px solid ${palette.accentBorder};
      font-weight: 500;
      letter-spacing: 0.04em;
    }

    .fn-pub-pill-neutral {
      background-color: ${palette.codeBg};
      color: ${palette.textSecondary};
      border: 1px solid ${palette.border};
    }

    .fn-pub-meta-divider {
      color: ${palette.textMuted};
    }

    /* Content Typography */
    .fn-pub-prose {
      color: ${palette.textPrimary};
      font-size: 15.5px;
      line-height: 1.78;
    }

    .fn-pub-prose h1,
    .fn-pub-prose h2,
    .fn-pub-prose h3,
    .fn-pub-prose h4,
    .fn-pub-prose h5,
    .fn-pub-prose h6 {
      font-family: var(--font-serif);
      color: ${palette.textPrimary};
      line-height: 1.28;
      letter-spacing: -0.015em;
    }

    .fn-pub-prose h1 {
      font-size: 1.95rem;
      font-weight: 600;
      margin-top: 1.9em;
      margin-bottom: 0.6em;
    }

    .fn-pub-prose h2 {
      font-size: 1.48rem;
      font-weight: 600;
      margin-top: 2.1em;
      margin-bottom: 0.55em;
      padding-bottom: 7px;
      border-bottom: 1px solid ${palette.borderSubtle};
    }

    .fn-pub-prose h3 {
      font-size: 1.22rem;
      font-weight: 600;
      margin-top: 1.6em;
      margin-bottom: 0.5em;
    }

    .fn-pub-prose h4 {
      font-size: 1.05rem;
      font-weight: 600;
      margin-top: 1.4em;
      margin-bottom: 0.45em;
    }

    .fn-pub-prose p {
      margin-bottom: 1.35em;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    .fn-pub-prose strong,
    .fn-pub-prose b {
      font-weight: 600;
      color: ${palette.textPrimary};
    }

    .fn-pub-prose em,
    .fn-pub-prose i {
      font-style: italic;
    }

    .fn-pub-prose blockquote {
      border-left: 3px solid ${palette.accent};
      padding: 12px 20px;
      margin: 1.75em 0;
      font-style: italic;
      color: ${palette.textSecondary};
      background-color: ${palette.accentSoft};
      border-radius: 0 4px 4px 0;
      line-height: 1.7;
    }

    .fn-pub-prose blockquote p:last-child {
      margin-bottom: 0;
    }

    .fn-pub-prose ul,
    .fn-pub-prose ol {
      margin-left: 1.65em;
      margin-bottom: 1.35em;
    }

    .fn-pub-prose li {
      margin-bottom: 0.45em;
      padding-left: 0.25em;
    }

    .fn-pub-prose li::marker {
      color: ${palette.accent};
    }

    .fn-pub-prose hr {
      border: none;
      height: 1px;
      background-color: ${palette.border};
      margin: 2.4em 0;
    }

    .fn-pub-prose a {
      color: ${palette.accent};
      text-decoration: underline;
      text-underline-offset: 3px;
      transition: color 150ms ease;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    .fn-pub-prose a:hover {
      color: ${palette.highlight};
    }

    .fn-pub-prose code {
      font-family: var(--font-mono);
      font-size: 13px;
      background-color: ${palette.codeBg};
      border: 1px solid ${palette.codeBorder};
      padding: 2px 5px;
      border-radius: 3px;
      color: ${palette.textPrimary};
    }

    .fn-pub-prose pre {
      background-color: ${palette.codeBg};
      border: 1px solid ${palette.codeBorder};
      border-radius: 4px;
      padding: 16px 18px;
      margin: 1.5em 0;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.6;
    }

    .fn-pub-prose pre code {
      background: transparent;
      border: none;
      padding: 0;
    }

    .fn-pub-prose table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.6em 0;
      font-size: 14px;
    }

    .fn-pub-prose th,
    .fn-pub-prose td {
      border: 1px solid ${palette.tableBorder};
      padding: 9px 13px;
      text-align: left;
    }

    .fn-pub-prose th {
      background-color: ${palette.tableHeaderBg};
      font-family: var(--font-mono);
      font-size: 11.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${palette.textSecondary};
    }

    /* Citation Pill Enhancement */
    .fn-citation-pill {
      display: inline-flex;
      align-items: center;
      font-family: var(--font-mono);
      font-size: 10.5px;
      font-weight: 600;
      color: ${palette.citationText};
      background-color: ${palette.citationBg};
      border: 1px solid ${palette.accentBorder};
      border-radius: 3px;
      padding: 0 5px;
      margin: 0 3px;
      vertical-align: 0.1em;
      letter-spacing: 0.02em;
    }

    /* Supporting Transcript Evidence Section */
    .fn-pub-sources {
      margin-top: 48px;
      padding-top: 28px;
      border-top: 1px solid ${palette.border};
    }

    .fn-pub-sources-heading {
      font-family: var(--font-serif);
      font-size: 1.35rem;
      font-weight: 600;
      margin-bottom: 16px;
      color: ${palette.textPrimary};
    }

    .fn-pub-sources-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 12px;
    }

    .fn-pub-source-card {
      background-color: ${palette.sheetBg};
      border: 1px solid ${palette.border};
      border-radius: 4px;
      padding: 12px 14px;
      font-size: 12.5px;
    }

    .fn-pub-source-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 10.5px;
      margin-bottom: 6px;
    }

    .fn-pub-source-title {
      font-weight: 600;
      color: ${palette.textPrimary};
      margin-bottom: 5px;
    }

    .fn-pub-source-excerpt {
      font-style: italic;
      color: ${palette.textSecondary};
      line-height: 1.5;
    }

    /* Document Colophon */
    .fn-pub-colophon {
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid ${palette.borderSubtle};
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: ${palette.textMuted};
      letter-spacing: 0.04em;
    }

    /* Responsive Adjustments */
    @media (max-width: 680px) {
      body {
        padding: 12px 8px 40px;
      }
      .fn-publication-sheet {
        padding: 24px 18px;
        border-radius: 2px;
      }
      .fn-pub-title {
        font-size: 1.85rem;
      }
      .fn-pub-sources-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Print Styles */
    @media print {
      html, body {
        background-color: #FFFFFF !important;
        color: #000000 !important;
        padding: 0 !important;
        font-size: 11pt !important;
        line-height: 1.5 !important;
      }
      .fn-publication-wrapper {
        max-width: 100% !important;
      }
      .fn-publication-sheet {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        background: transparent !important;
      }
      .fn-pub-masthead {
        border-bottom: 1.5pt solid #526A46 !important;
      }
      .fn-pub-prose h1,
      .fn-pub-prose h2,
      .fn-pub-prose h3 {
        break-after: avoid;
        page-break-after: avoid;
        color: #000000 !important;
      }
      .fn-pub-prose blockquote,
      .fn-pub-prose table,
      .fn-pub-prose pre,
      .fn-pub-source-card {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .fn-pub-prose a {
        text-decoration: underline !important;
        color: #000000 !important;
      }
      .fn-pub-pill,
      .fn-citation-pill {
        border: 0.5pt solid #888 !important;
        background: transparent !important;
        color: #000000 !important;
      }
    }
  `;
}

/**
 * Format timestamp safely without inventing fake dates.
 */
function formatPublicationDate(timestamp) {
  if (!timestamp) return null;
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (_) {
    return null;
  }
}

/**
 * Escape HTML special characters for attributes and text nodes.
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build a complete, self-contained HTML5 editorial document.
 * Suitable for both the in-app sandboxed iframe preview (srcDoc)
 * and standalone offline HTML export (saved directly to user disk).
 */
export function buildEditorialDocument({
  artifact,
  isDark = false,
  forExport = false
}) {
  const title = (artifact?.title || 'FIELDNOTES Editorial Artifact').trim();
  const topic = artifact?.topic ? String(artifact.topic).trim() : null;
  const wordCount = typeof artifact?.word_count === 'number' && artifact.word_count > 0
    ? artifact.word_count
    : null;
  const formattedDate = formatPublicationDate(artifact?.created_at);
  const sources = Array.isArray(artifact?.sources) ? artifact.sources : [];

  // Strictly sanitize the incoming HTML body content
  const rawHtml = artifact?.html || artifact?.content_html || artifact?.content || '';
  const sanitizedBodyHtml = sanitizeArtifactHtml(rawHtml);

  // Generate self-contained CSS stylesheet
  const embeddedCss = buildEditorialStylesheet({ isDark, forExport });

  // Render supporting sources section if legitimate evidence exists
  let sourcesSectionHtml = '';
  if (sources.length > 0) {
    const sourceCards = sources.map((src) => {
      const srcId = escapeHtml(src.id || 'Evidence');
      const srcGuest = src.guest ? escapeHtml(src.guest) : null;
      const srcTitle = escapeHtml(src.title || 'Lenny\'s Podcast');
      const srcExcerpt = src.excerpt ? escapeHtml(src.excerpt) : null;
      const safeUrl = src.youtube_url && /^https?:\/\//i.test(src.youtube_url)
        ? escapeHtml(src.youtube_url)
        : null;

      return `
        <div class="fn-pub-source-card">
          <div class="fn-pub-source-meta">
            <span class="fn-citation-pill">${srcId}</span>
            ${srcGuest ? `<span class="fn-pub-pill fn-pub-pill-neutral">${srcGuest}</span>` : ''}
          </div>
          <div class="fn-pub-source-title">${srcTitle}</div>
          ${srcExcerpt ? `<div class="fn-pub-source-excerpt">"${srcExcerpt}"</div>` : ''}
          ${safeUrl ? `<div style="margin-top: 6px;"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 11px;">Episode Reference ↗</a></div>` : ''}
        </div>
      `;
    }).join('\n');

    sourcesSectionHtml = `
      <section class="fn-pub-sources">
        <h3 class="fn-pub-sources-heading">Supporting Transcript Evidence</h3>
        <div class="fn-pub-sources-grid">
          ${sourceCards}
        </div>
      </section>
    `;
  }

  // Meta pills row
  const metaPills = [];
  if (topic) {
    metaPills.push(`<span class="fn-pub-pill">${escapeHtml(topic)}</span>`);
  }
  if (wordCount) {
    metaPills.push(`<span class="fn-pub-pill fn-pub-pill-neutral">${wordCount.toLocaleString()} WORDS</span>`);
  }
  if (formattedDate) {
    metaPills.push(`<span class="fn-pub-pill fn-pub-pill-neutral">${escapeHtml(formattedDate)}</span>`);
  }
  if (sources.length > 0) {
    metaPills.push(`<span class="fn-pub-pill fn-pub-pill-neutral">${sources.length} SOURCES</span>`);
  }

  const metaRowHtml = metaPills.length > 0
    ? `<div class="fn-pub-meta-row">${metaPills.join('\n')}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)} — FIELDNOTES</title>
    <style>
${embeddedCss}
    </style>
  </head>
  <body>
    <div class="fn-publication-wrapper">
      <article class="fn-publication-sheet">
        <header class="fn-pub-masthead">
          <div class="fn-pub-rubric">
            <div class="fn-pub-rubric-left">
              <span class="fn-pub-rubric-badge"></span>
              <span>FIELDNOTES // Editorial Research Document</span>
            </div>
            <span>Lenny's Podcast Synthesis</span>
          </div>

          <h1 class="fn-pub-title">${escapeHtml(title)}</h1>

          ${metaRowHtml}
        </header>

        <div class="fn-pub-prose">
          ${sanitizedBodyHtml || '<p><em>No document content available.</em></p>'}
        </div>

        ${sourcesSectionHtml}

        <footer class="fn-pub-colophon">
          <span>LENNY GROWTH ASSISTANT • FIELDNOTES RESEARCH STUDIO</span>
          <span>GROUNDED IN ARCHIVED TRANSCRIPTS</span>
        </footer>
      </article>
    </div>
  </body>
</html>`;
}

/**
 * Triggers clean standalone HTML export to disk.
 * Returns the exact generated HTML document string.
 * Works completely offline without runtime dependencies.
 */
export function exportArtifactAsHtml(artifact) {
  if (!artifact) {
    throw new Error('No artifact available for export.');
  }

  // Generate self-contained standalone document
  const htmlContent = buildEditorialDocument({
    artifact,
    isDark: false,
    forExport: true,
  });

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const rawTitle = artifact.title || 'fieldnotes_editorial';
  const cleanSlug = rawTitle
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .toLowerCase()
    .replace(/^_+|_+$/g, '') || 'fieldnotes_editorial';

  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanSlug}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Defer revocation to avoid Chrome race condition where instant revocation cancels async download
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);

  return htmlContent;
}
