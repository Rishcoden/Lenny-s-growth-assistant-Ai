import {
  sanitizeArtifactHtml,
  buildEditorialStylesheet,
  buildEditorialDocument,
  exportArtifactAsHtml
} from './artifactDocument';

describe('artifactDocument — Security & Document Generation', () => {
  describe('HTML Sanitization (Security Requirements)', () => {
    test('strips malicious <script> tags and active scripts', () => {
      const malicious = '<h1>Title</h1><script>alert("xss")</script><p>Safe content</p>';
      const cleaned = sanitizeArtifactHtml(malicious);
      expect(cleaned).not.toContain('<script');
      expect(cleaned).not.toContain('alert(');
      expect(cleaned).toContain('<h1>Title</h1>');
      expect(cleaned).toContain('<p>Safe content</p>');
    });

    test('strips event-handler attributes (onerror, onload, onclick, onmouseover)', () => {
      const malicious = `
        <img src="invalid-url" onerror="alert('xss')" />
        <div onmouseover="alert('attack')">Hover me</div>
        <button onclick="stealData()">Click</button>
        <svg onload="alert('svg-xss')"></svg>
      `;
      const cleaned = sanitizeArtifactHtml(malicious);
      expect(cleaned).not.toContain('onerror');
      expect(cleaned).not.toContain('onmouseover');
      expect(cleaned).not.toContain('onclick');
      expect(cleaned).not.toContain('onload');
      expect(cleaned).not.toContain('alert(');
      expect(cleaned).not.toContain('<button'); // buttons are forbidden
    });

    test('strips dangerous URI schemes (javascript:, data:, vbscript:)', () => {
      const malicious = `
        <a href="javascript:alert(document.cookie)">Malicious Link</a>
        <a href="data:text/html,<script>alert(1)</script>">Data Link</a>
        <a href="vbscript:msgbox(1)">VBScript Link</a>
        <a href="https://example.com/legitimate">Valid Link</a>
      `;
      const cleaned = sanitizeArtifactHtml(malicious);
      expect(cleaned).not.toContain('href="javascript:');
      expect(cleaned).not.toContain('href="data:');
      expect(cleaned).not.toContain('href="vbscript:');
      expect(cleaned).toContain('href="https://example.com/legitimate"');
    });

    test('strips nested iframes, objects, embeds, and style injection', () => {
      const malicious = `
        <iframe src="https://attacker.com/leak"></iframe>
        <object data="malicious.swf"></object>
        <embed src="malicious.pdf"></embed>
        <style>body { display: none; }</style>
        <p>Legitimate paragraph</p>
      `;
      const cleaned = sanitizeArtifactHtml(malicious);
      expect(cleaned).not.toContain('<iframe');
      expect(cleaned).not.toContain('<object');
      expect(cleaned).not.toContain('<embed');
      expect(cleaned).not.toContain('<style');
      expect(cleaned).toContain('<p>Legitimate paragraph</p>');
    });

    test('hardens legitimate links with target="_blank" and rel="noopener noreferrer"', () => {
      const input = '<p>Read more at <a href="https://lennygrowth.com">Lenny\'s Newsletter</a></p>';
      const cleaned = sanitizeArtifactHtml(input);
      expect(cleaned).toContain('href="https://lennygrowth.com"');
      expect(cleaned).toContain('target="_blank"');
      expect(cleaned).toContain('rel="noopener noreferrer"');
    });

    test('preserves legitimate semantic formatting and typography', () => {
      const input = `
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
        <blockquote>"Growth is a loop, not a funnel."</blockquote>
        <ul><li>Item A</li><li>Item B</li></ul>
        <ol><li>Step 1</li></ol>
        <hr />
        <pre><code>const loop = true;</code></pre>
        <table>
          <thead><tr><th>Phase</th><th>Metric</th></tr></thead>
          <tbody><tr><td>Activation</td><td>70%</td></tr></tbody>
        </table>
      `;
      const cleaned = sanitizeArtifactHtml(input);
      expect(cleaned).toContain('<h1>Heading 1</h1>');
      expect(cleaned).toContain('<h2>Heading 2</h2>');
      expect(cleaned).toContain('<h3>Heading 3</h3>');
      expect(cleaned).toContain('<strong>bold</strong>');
      expect(cleaned).toContain('<em>italic</em>');
      expect(cleaned).toContain('<blockquote>"Growth is a loop, not a funnel."</blockquote>');
      expect(cleaned).toContain('<ul><li>Item A</li><li>Item B</li></ul>');
      expect(cleaned).toContain('<pre><code>const loop = true;</code></pre>');
      expect(cleaned).toContain('<th>Phase</th>');
      expect(cleaned).toContain('<td>Activation</td>');
    });

    test('preserves Unicode punctuation and special characters correctly', () => {
      const input = '<p>“Quotes with curly marks” — em dash • bullet point and accented naïve voilà.</p>';
      const cleaned = sanitizeArtifactHtml(input);
      expect(cleaned).toContain('“Quotes with curly marks”');
      expect(cleaned).toContain('— em dash');
      expect(cleaned).toContain('• bullet point');
      expect(cleaned).toContain('naïve voilà');
    });

    test('transforms inline citations [S1], [S2] into styled citation pills', () => {
      const input = '<p>According to Casey Winters [S1], compounding loops [S2] outperform funnels.</p>';
      const cleaned = sanitizeArtifactHtml(input);
      expect(cleaned).toContain('<span class="fn-citation-pill">S1</span>');
      expect(cleaned).toContain('<span class="fn-citation-pill">S2</span>');
    });

    test('handles empty or non-string input gracefully', () => {
      expect(sanitizeArtifactHtml('')).toBe('');
      expect(sanitizeArtifactHtml(null)).toBe('');
      expect(sanitizeArtifactHtml(undefined)).toBe('');
      expect(sanitizeArtifactHtml(123)).toBe('');
    });
  });

  describe('buildEditorialStylesheet', () => {
    test('contains editorial typography and print media query rules', () => {
      const css = buildEditorialStylesheet({ isDark: false, forExport: true });
      expect(css).toContain('--font-serif');
      expect(css).toContain('--font-sans');
      expect(css).toContain('--font-mono');
      expect(css).toContain('.fn-publication-sheet');
      expect(css).toContain('.fn-pub-masthead');
      expect(css).toContain('.fn-pub-prose');
      expect(css).toContain('@media print');
      expect(css).toContain('page-break-after: avoid');
      expect(css).toContain('page-break-inside: avoid');
    });

    test('handles dark mode palette variation', () => {
      const darkCss = buildEditorialStylesheet({ isDark: true, forExport: false });
      expect(darkCss).toContain('color-scheme: dark');
      expect(darkCss).toContain('#151714');
    });
  });

  describe('buildEditorialDocument', () => {
    const mockArtifact = {
      title: 'The Architecture of Growth Loops',
      topic: 'Growth Strategy',
      word_count: 1250,
      created_at: '2026-10-12T10:00:00Z',
      sources: [
        {
          id: 'S1',
          guest: 'Elena Verna',
          title: 'B2B PLG Dynamics',
          excerpt: 'Retention precedes expansion.',
          youtube_url: 'https://youtube.com/watch?v=example'
        }
      ],
      html: '<h2>1. The Loop</h2><p>Linear acquisition models decay [S1].</p>'
    };

    test('produces a complete, self-contained HTML5 document', () => {
      const doc = buildEditorialDocument({ artifact: mockArtifact });
      expect(doc.startsWith('<!DOCTYPE html>')).toBe(true);
      expect(doc).toContain('<html lang="en">');
      expect(doc).toContain('<meta charset="UTF-8">');
      expect(doc).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
      expect(doc).toContain('<title>The Architecture of Growth Loops — FIELDNOTES</title>');
      expect(doc).toContain('<style>');
      expect(doc).toContain('The Architecture of Growth Loops</h1>');
      expect(doc).toContain('Growth Strategy');
      expect(doc).toContain('1,250 WORDS');
      expect(doc).toContain('Elena Verna');
      expect(doc).toContain('Supporting Transcript Evidence');
      expect(doc).toContain('Linear acquisition models decay');
      expect(doc).toContain('<span class="fn-citation-pill">S1</span>');
      expect(doc).toContain('</html>');
    });

    test('escapes malicious title and metadata to prevent header injection', () => {
      const dangerousArtifact = {
        title: '<script>alert("title-xss")</script>Dangerous Title',
        topic: '<img src=x onerror=alert("topic")>',
        word_count: 500,
        html: '<p>Body content</p>'
      };

      const doc = buildEditorialDocument({ artifact: dangerousArtifact });
      expect(doc).not.toContain('<script>alert("title-xss")</script>');
      expect(doc).not.toContain('onerror=alert("topic")');
      expect(doc).toContain('&lt;script&gt;alert(&quot;title-xss&quot;)&lt;/script&gt;');
    });

    test('handles missing or empty artifact properties gracefully without crashing', () => {
      const doc = buildEditorialDocument({ artifact: {} });
      expect(doc).toContain('<!DOCTYPE html>');
      expect(doc).toContain('FIELDNOTES Editorial Artifact');
      expect(doc).toContain('No document content available.');
    });

    test('filters out unsafe URLs in sources evidence section', () => {
      const artifactWithBadUrl = {
        title: 'Evidence Test',
        sources: [
          {
            id: 'S1',
            title: 'Hacked Podcast',
            youtube_url: 'javascript:alert("source-xss")'
          }
        ],
        html: '<p>Content</p>'
      };

      const doc = buildEditorialDocument({ artifact: artifactWithBadUrl });
      expect(doc).not.toContain('javascript:alert');
    });
  });

  describe('exportArtifactAsHtml (Regression & Security Tests)', () => {
    let capturedBlobContent = null;
    let createObjectURLMock;
    let revokeObjectURLMock;

    beforeEach(() => {
      capturedBlobContent = null;
      createObjectURLMock = jest.fn((blob) => {
        // Capture blob content if possible in test
        return 'blob:mock-url';
      });
      revokeObjectURLMock = jest.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;
    });

    test('creates and revokes Blob URL on document export with deferred revoke', () => {
      jest.useFakeTimers();
      const mockArtifact = {
        title: 'Compounding Scale',
        html: '<p>Testing export mechanism</p>'
      };

      exportArtifactAsHtml(mockArtifact);

      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
      // Revocation is deferred to prevent Chromium premature cancellation
      expect(revokeObjectURLMock).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });

    test('REGRESSION: exports complete self-contained HTML5 document with embedded <style> and editorial CSS rules', () => {
      const mockArtifact = {
        title: 'The Architecture of Modern Growth Loops',
        topic: 'Growth Loops',
        word_count: 1248,
        created_at: '2026-10-12T06:00:00Z',
        html: '<h2>1. Compounding Loops</h2><p>Linear acquisition models decay [S1].</p><blockquote>Loops compound.</blockquote>',
        sources: [
          {
            id: 'S1',
            guest: 'Casey Winters',
            title: 'Loop Dynamics',
            excerpt: 'Closed loops compound over time.'
          }
        ]
      };

      const exportedHtml = exportArtifactAsHtml(mockArtifact);

      // 1. Verify complete HTML5 structure
      expect(typeof exportedHtml).toBe('string');
      expect(exportedHtml.startsWith('<!DOCTYPE html>')).toBe(true);
      expect(exportedHtml).toContain('<html lang="en">');
      expect(exportedHtml).toContain('<head>');
      expect(exportedHtml).toContain('<meta charset="UTF-8">');
      expect(exportedHtml).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
      expect(exportedHtml).toContain('<title>The Architecture of Modern Growth Loops — FIELDNOTES</title>');
      expect(exportedHtml).toContain('</head>');
      expect(exportedHtml).toContain('<body>');
      expect(exportedHtml).toContain('</body>');
      expect(exportedHtml).toContain('</html>');

      // 2. Verify embedded stylesheet is present and NOT stripped
      expect(exportedHtml).toContain('<style>');
      expect(exportedHtml).toContain('</style>');
      const styleBlockMatch = exportedHtml.match(/<style>([\s\S]*?)<\/style>/);
      expect(styleBlockMatch).not.toBeNull();
      const cssContent = styleBlockMatch[1];
      expect(cssContent.length).toBeGreaterThan(2000); // Substantial stylesheet

      // 3. Verify key FIELDNOTES layout and typography CSS rules
      expect(cssContent).toContain('--font-serif');
      expect(cssContent).toContain('--font-sans');
      expect(cssContent).toContain('--font-mono');
      expect(cssContent).toContain('.fn-publication-wrapper');
      expect(cssContent).toContain('max-width: 820px');
      expect(cssContent).toContain('.fn-publication-sheet');
      expect(cssContent).toContain('background-color: #FFFFFF');
      expect(cssContent).toContain('border: 1px solid #DEDCD2');
      expect(cssContent).toContain('.fn-pub-masthead');
      expect(cssContent).toContain('border-bottom: 2px solid #526A46');
      expect(cssContent).toContain('.fn-pub-title');
      expect(cssContent).toContain('.fn-pub-prose');
      expect(cssContent).toContain('.fn-citation-pill');
      expect(cssContent).toContain('@media print');
      expect(cssContent).toContain('page-break-after: avoid');
      expect(cssContent).toContain('page-break-inside: avoid');

      // 4. Verify document content is wrapped inside publication sheet rather than raw body
      expect(exportedHtml).toContain('<div class="fn-publication-wrapper">');
      expect(exportedHtml).toContain('<article class="fn-publication-sheet">');
      expect(exportedHtml).toContain('<div class="fn-pub-prose">');
      expect(exportedHtml).toContain('Compounding Loops</h2>');
      expect(exportedHtml).toContain('<span class="fn-citation-pill">S1</span>');
      expect(exportedHtml).toContain('Supporting Transcript Evidence');
      expect(exportedHtml).toContain('Casey Winters');
    });

    test('REGRESSION: sanitizes malicious payload in body while preserving document shell and embedded <style>', () => {
      const maliciousArtifact = {
        title: 'Security Verification',
        html: '<h2>Title</h2><script>alert("xss")</script><img src=x onerror="alert(1)"><p>Safe text</p>'
      };

      const exportedHtml = exportArtifactAsHtml(maliciousArtifact);

      // Malicious payloads stripped
      expect(exportedHtml).not.toContain('<script');
      expect(exportedHtml).not.toContain('onerror');
      expect(exportedHtml).not.toContain('alert(');

      // Document shell and style block preserved
      expect(exportedHtml).toContain('<!DOCTYPE html>');
      expect(exportedHtml).toContain('<style>');
      expect(exportedHtml).toContain('max-width: 820px');
      expect(exportedHtml).toContain('<p>Safe text</p>');
    });

    test('throws error if artifact is null or undefined', () => {
      expect(() => exportArtifactAsHtml(null)).toThrow('No artifact available for export.');
    });
  });
});
