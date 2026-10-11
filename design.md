# Product & UI/UX Design Document (design.md)
## FIELDNOTES — Editorial Intelligence Studio Design System

---

### Document Information
- **Design System Name**: FIELDNOTES ("The Product Research Desk")
- **Product**: Lenny Growth Assistant
- **Version**: 1.0.0
- **Document Status**: Production Baseline
- **Implementation Stack**: React 19 + Vanilla CSS Variables & Design Tokens (zero Tailwind, zero CSS-in-JS runtime overhead)
- **Primary Style Files**:
  - [`frontend/src/styles/tokens.css`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/styles/tokens.css)
  - [`frontend/src/styles/global.css`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/styles/global.css)
  - [`frontend/src/styles/components.css`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/styles/components.css)

---

### 1. Design Overview and Philosophy

**FIELDNOTES** is an intentional departure from the generic, homogenized "AI chatbot bubble" aesthetic (e.g. blue gradients, rounded floating speech bubbles, pulsing purple neon effects). Instead, FIELDNOTES is designed as an **editorial research studio and thinking workbench** for technology leaders, inspired by premier technical periodicals, physical research notebooks, and high-craft typography.

The interface prioritizes **provability, density, calm focus, and legibility**:
- The screen feels like an intellectual archive: structured margins, serif editorial headlines, monospaced metadata cues, and botanical olive and terracotta accents.
- Answers are formatted as publication-grade synthesis memos, not chat dialogs.
- The UI treats citations as first-class interactive instruments: evidence is always one click away in a dedicated inspector rail.

---

### 2. Target Users and Their UX Needs

| Persona | UX Context & Mental Model | Core Interaction Needs | Key UI Surface |
|---|---|---|---|
| **Startup Founder** | High cognitive load, scanning for benchmarks and decision rules. | Fast query entry, scannable summaries, direct takeaways without preamble. | `HomePage` curated inquiry list, `ChatComposer`, `SavedInsightsPage`. |
| **Product Manager** | Preparing strategic briefs, investigating competitor tactics. | Interactive inline citations `[S1]`, provenance verification, verbatim quotes. | `ChatMessage` citation chips, `SourcePanel` drawer, YouTube timestamp links. |
| **Growth Practitioner** | Deep analysis of funnel and loop mechanics. | Multi-episode synthesis, comparing viewpoints across multiple guests. | `DiscoverPage` topic index, evidence comparison cards. |
| **Product Executive** | Synthesizing organizational strategy and editorial papers. | Long-form reading comfort, distraction-free document views, export tools. | `EssayStudioPage`, `ArtifactPage` reading mode. |

---

### 3. Design Principles

1. **Provability Over Assertion**: No AI response should stand without proof. Every factual claim is bound to an interactive citation token (`[S1]`, `[S2]`) that actively controls the evidence inspector.
2. **Editorial Restraint**: Generous whitespace, muted background washes (`#F5F4EF` in light mode, `#151714` in dark mode), sharp borders (`var(--border)`), and razor-thin radius curves (`2px` to `6px`).
3. **Typography as Information Hierarchy**: Clear division of typographic roles:
   - **Serif** for intellectual thesis headlines and essay titles.
   - **Sans-Serif** for high-legibility body prose, synthesis reading, and UI controls.
   - **Monospace** for system telemetry, episode timestamps, citation IDs, and keyboard cues.
4. **Workspace Over Chat**: Rather than an ephemeral message stream, inquiries feel like organized research dossiers with persistent thread management, saved notebooks, and long-form artifacts.

---

### 4. Visual Identity & Brand System

#### Studio Brand Mark
Located at the top of the Navigation Rail, the brand identity combines a minimalist geometric studio mark with strict typography:
- **Icon**: An SVG grid mark featuring three rounded squares and an offset targeting crosshair:
  ```svg
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 17.5h7m-3.5-3.5v7" />
  </svg>
  ```
- **Brand Wordmark**:
  - `LENNY` (Heavy Sans-Serif, letter-spacing `0.08em`)
  - `GROWTH ASSISTANT` (Muted Subtitle, font size `11px`)
  - `PRODUCT INTELLIGENCE STUDIO` (Monospace rubric, letter-spacing `0.09em`, font size `9.5px`)

---

### 5. Color System & Theme Behavior

FIELDNOTES implements a two-tier color token architecture defined in `tokens.css`. Switching themes toggles the `data-theme="light"` or `data-theme="dark"` attribute on `<html>`, triggering smooth CSS variable transitions (`var(--transition-theme)`).

#### Color Token Mapping Table

| Semantic Role | Light Theme Value | Dark Theme Value | Usage Description |
|---|---|---|---|
| `--app-bg` | `#F5F4EF` (Muted Warm Parchment) | `#151714` (Deep Charcoal Pine) | Overall canvas backdrop |
| `--surface` | `#FFFFFF` (Pure White) | `#1C201B` (Olive Surface) | Primary cards, panels, modals |
| `--surface-secondary` | `#ECEBE4` (Warm Gray-Buff) | `#252A23` (Muted Slate Green) | Input containers, card hover states |
| `--surface-hover` | `#E7E5DC` | `#2C3229` | List item active and hover fills |
| `--text-primary` | `#20231F` (Off-Black Forest) | `#F0F0E9` (Warm Alabaster) | Headlines, primary synthesis prose |
| `--text-secondary` | `#72766C` (Muted Olive Gray) | `#A0A69A` (Sage Gray) | Subtitles, supporting copy, labels |
| `--text-muted` | `#969A8E` (Faded Sage) | `#6B7265` (Subdued Olive) | Meta tags, timestamps, shortcuts |
| `--border` | `#DEDCD2` (Pale Stone) | `#343A30` (Charcoal Slate) | Card borders, dividers, inputs |
| `--border-subtle` | `#E8E7DF` | `#292E25` | Intra-component line dividers |
| `--border-focus` | `#526A46` | `#A9C493` | Form focus rings, active citation borders |
| `--accent` | `#526A46` (Deep Botanical Olive) | `#A9C493` (Pale Willow Green) | Primary actions, synthesis tags, citations |
| `--accent-soft` | `#E4EBDD` | `#273423` | Active citation backgrounds, pill badges |
| `--highlight` | `#C96F4A` (Terracotta Brick) | `#E39A76` (Warm Apricot) | Secondary badges, external links |
| `--danger` / `--danger-bg` | `#B43830` / `#FAECEB` | `#E06D66` / `#321F1E` | Error banners, delete buttons |
| `--success` / `--success-bg` | `#3E7348` / `#EAF4EB` | `#70B87E` / `#1C2E20` | Copy confirmation checkmarks |

#### Theme Hook & Persistence
Theme state is managed by [`frontend/src/hooks/useTheme.js`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/hooks/useTheme.js):
1. Detects saved `localStorage.getItem('lenny_theme')`.
2. Falls back to OS preference via `window.matchMedia('(prefers-color-scheme: dark)')`.
3. Sets `data-theme` and `document.documentElement.style.colorScheme`.

---

### 6. Typography

Typography is loaded via Google Fonts in `public/index.html` and categorized into three functional font stacks:

```css
--font-serif: 'Instrument Serif', 'Newsreader', Georgia, serif;
--font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'IBM Plex Mono', 'SF Mono', Menlo, Consolas, monospace;
```

#### Typographic Hierarchy

| Role | Font Family | Size | Weight | Line Height | Tracking | Example Usage |
|---|---|---|---|---|---|---|
| **Display Headline** | `--font-serif` | `34px - 40px` | 400 (Regular) | `1.18` | `-0.015em` | "Build products people come back to." |
| **Page Title** | `--font-serif` | `28px - 32px` | 400 | `1.22` | `-0.01em` | "Essay Studio", "Topic Index" |
| **Section Heading (H2)** | `--font-sans` | `18px - 20px` | 600 (SemiBold) | `1.3` | `-0.01em` | "Curated Inquiries", "Featured Topics" |
| **Editorial Prose** | `--font-sans` | `14.5px - 15px` | 400 | `1.65` | `0` | AI synthesis answers, essay body |
| **Technical Label / Tag** | `--font-mono` | `10.5px - 11px` | 600 | `1.4` | `+0.08em` | `STUDIO //`, `303 EPISODES // GROUNDED RAG` |
| **Citation Chip** | `--font-mono` | `11px` | 600 | `1.2` | `+0.04em` | `[S1]`, `[S2]` |
| **Keyboard Cue** | `--font-mono` | `11px` | 400 | `1.2` | `0` | `↵ to inquire`, `⇧↵ for newline` |

---

### 7. Layout & Navigation Structure

The FIELDNOTES application implements a three-region viewport skeleton layout (`frontend/src/components/AppLayout.jsx`):

```
┌─────────────────┬──────────────────────────────────────────┬──────────────────────┐
│  NAVIGATION     │          RESEARCH CANVAS                 │  EVIDENCE INSPECTOR  │
│  RAIL           │                                          │  (COLLAPSIBLE)       │
│  (270px)        │  Header: Rubric + Evidence Button        │  (390px)             │
│                 ├──────────────────────────────────────────┤                      │
│  - Brand Block  │                                          │  Header: [S1] Cards  │
│  - New Inquiry  │  Page Viewport:                          │  - Episode Title     │
│  - Nav Links    │  - Home / Discover / Saved / Studio / Chat│  - Guest Name        │
│  - History List │                                          │  - Verbatim Passage  │
│  - Instrument   │                                          │  - Similarity Score  │
│    Panel        │                                          │  - YouTube Link      │
└─────────────────┴──────────────────────────────────────────┴──────────────────────┘
```

1. **Navigation Rail (`.fn-nav-rail`)**: Fixed 270px width. Houses branding, primary navigation routes (`/`, `/discover`, `/saved-insights`, `/essay-studio`), categorized conversation history grouped by timeframe, and the bottom instrument panel.
2. **Research Canvas (`.research-canvas-column`)**: Flexible center column. Features a minimal top subheader with view rubric, mobile drawer toggle, and the evidence toggle button.
3. **Evidence Inspector (`.fn-evidence-inspector`)**: Fixed 390px right drawer. Displays retrieved podcast evidence with cosine similarity scores, speaker attributions, verbatim quotes, and external links. Can be collapsed or expanded via header controls.

---

### 8. Main Application Screens

#### 8.1. Home Page (`HomePage.jsx`)
- **Rubric**: `Fieldnotes / Product Research`.
- **Editorial Headline**: *"Build products people come back to."*
- **Hero Composer**: Large prominent `ChatComposer` with accent label bar (`ASK THE LIBRARY // 303 EPISODES`).
- **Curated Inquiries ("Questions Worth Exploring //")**: Staggered list of 5 high-signal questions with numeric tags (`01 /`, `02 /`), allowing immediate one-click inquiry launches.
- **Thematic Domains Grid**: 6 domain cards (Growth, Retention, Product Strategy, Leadership, Product-Market Fit, Hiring & Teams) with custom Lucide icons.

#### 8.2. Research Chat Workspace (`ChatPage.jsx`)
- **Thread Document Subheader**: Displays active inquiry title (`DOCUMENT // ...`) and current inference model badge (`llama3.2`).
- **Message Stream**: Alternating inquiry blocks and synthesis boxes.
  - User inquiries: Clean text containers with `INQUIRY // USER` provenance tags.
  - Assistant syntheses: White editorial cards with `SYNTHESIS // LENNY ARCHIVE` tags, rendered via `ReactMarkdown` with custom overrides intercepting citation tokens into clickable chips.
  - Message Action Bar: Quick-copy button (`Copy`), bookmark button (`Save Insight`), and evidence drawer launcher (`Evidence (5)`).
- **Docked Bottom Composer**: Persistent input pinned to the base of the canvas for threaded follow-up research.

#### 8.3. Discover Topic Desk (`DiscoverPage.jsx`)
- **Rubric**: `Topic Index // Curated Knowledge`.
- **Search & Filter**: Real-time text filter matching domain titles and descriptions.
- **Two-Column Explorer**:
  - Left Column: Clickable domain cards showing domain tags (e.g. `Growth`, `Acquisition`, `PLG`) and 3 sample questions.
  - Right Column: Live Evidence Preview pane displaying actual ChromaDB transcript passages matching the selected topic.

#### 8.4. Saved Insights Notebook (`SavedInsightsPage.jsx`)
- **Rubric**: `Personal Notebook // Fieldnotes`.
- **Headline**: *"Keep the ideas that matter."*
- **Card Grid**: Bookmarked synthesis responses featuring topic tags, timestamps, full markdown content, source citations, clipboard copy, and deletion actions.
- **Empty State**: Centered notebook graphic with explanatory guidance for saving insights.

#### 8.5. Essay Studio (`EssayStudioPage.jsx`)
- **Rubric**: `Writing Desk // Long-Form Synthesis`.
- **Editorial Form**: Form fields for Essay Topic, Central Question/Thesis, Target Audience, and Editorial Tone.
- **Generation View**: Displays live progress indicator, generated word count, rendered markdown preview, and a link to view the publication artifact.

#### 8.6. Sandboxed Artifact Viewer (`ArtifactPage.jsx`)
- **Header Actions**: Return to studio, view toggle (`Reading Mode` vs `Raw Markdown`), Copy Content, and Download button (`.html` or `.md`).
- **Security Sandboxing**: Displays HTML output inside an `<iframe>` populated with `DOMPurify.sanitize()` output, injecting customized stylesheet tokens so the iframe matches the active light/dark theme.

---

### 9. Reusable UI Components

| Component File | Role & Visual Behavior | Key Props / State |
|---|---|---|
| [`AppLayout.jsx`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/components/AppLayout.jsx) | Three-column skeleton manager; manages mobile drawer open state and evidence panel toggle. | `conversations`, `sources`, `activeCitationId`, `theme`. |
| [`Sidebar.jsx`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/components/Sidebar.jsx) | Primary navigation rail, ⌘N shortcut, model status chip, theme toggle button. | `activeModelName`, `isBackendConnected`, `onToggleTheme`. |
| [`ConversationList.jsx`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/components/ConversationList.jsx) | Groups conversations into `Today`, `This Week`, `Earlier`; inline title editing with Check/X buttons; delete confirmation. | `conversations`, `activeConversationId`, `onRename`, `onDelete`. |
| [`ChatComposer.jsx`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/components/ChatComposer.jsx) | Auto-expanding textarea up to 200px; keyboard enter listener; animated pulse button when loading. | `value`, `onChange`, `onSubmit`, `isLoading`, `label`. |
| [`ChatMessage.jsx`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/components/ChatMessage.jsx) | Renders user and assistant blocks; custom markdown components mapping `/\[(S\d+)\]/g` to `Citation` components. | `message`, `activeCitationId`, `onCitationClick`, `onSaveInsight`. |
| [`Citation.jsx`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/components/Citation.jsx) | Interactive monospace button `[S1]`; adds `.active` class when selected; handles click stopPropagation. | `id`, `isActive`, `onClick`. |
| [`SourcePanel.jsx`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/components/SourcePanel.jsx) | Collapsible right inspector; auto-scrolls to focused card via `cardRefs[id].scrollIntoView()`. | `sources`, `activeCitationId`, `isOpen`, `onClose`. |
| [`ModelSelectorModal.jsx`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/components/ModelSelectorModal.jsx) | Accessible dialog with Escape key listener; shows local/cloud model cards, configuration badges, and checkmarks. | `isOpen`, `onClose`, `models`, `selectedModelId`, `onSelect`. |
| [`LoadingState.jsx`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/components/LoadingState.jsx) | Multi-stage status indicator cycling through RAG progress stages every 2.8s. | Internal stage rotation timer. |
| [`ErrorState.jsx`](file:///Users/kaarthikrishaanth/lenny-growth-assistant/frontend/src/components/ErrorState.jsx) | Red-tinted alert box with AlertCircle icon, error explanation, and Retry button. | `message`, `onRetry`. |

---

### 10. Interaction Patterns

#### 10.1. Citation-to-Evidence Linkage
```
[User clicks "[S1]" chip in synthesis answer]
                  │
                  ▼
ChatMessage invokes onCitationClick("S1")
                  │
                  ▼
App.js updates activeCitationId = "S1" & ensures isSourcePanelOpen = true
                  │
                  ▼
SourcePanel detects activeCitationId change via useEffect
                  │
                  ▼
cardRefs["S1"].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  │
                  ▼
CSS applies .fn-source-item.highlighted (accent border + soft accent background)
```

#### 10.2. Keyboard Shortcuts & Cues
- `Enter` (without Shift): Submits the research inquiry in `ChatComposer`.
- `Shift + Enter`: Inserts a newline in the prompt textarea.
- `Escape`: Closes `ModelSelectorModal` and cancels conversation rename mode.
- `⌘N` (Mac visual indicator): Cued on the "New Inquiry" button in the sidebar.

#### 10.3. Inline Thread Renaming
- Hovering over any conversation in the sidebar reveals the Edit (pencil) and Delete (trash) icons.
- Clicking Edit replaces the title with a live text input, autofocusing the field and providing Check (`Enter`) and Close (`Escape`) buttons.

---

### 11. Loading, Empty, and Error States

#### Loading States
- **ChatComposer**: Submit button disables, replaces "Inquire" icon with a pulsing status dot.
- **Message Thread**: Renders `LoadingState` with animated dot cycling through realistic RAG stages:
  1. *"Searching 32,000+ podcast transcript passages..."*
  2. *"Reviewing guest models & citations..."*
  3. *"Formulating grounded synthesis..."*
- **Discover Evidence**: Displays a centered loading indicator while fetching live topic passages.

#### Empty States
- **Conversation List**: When no previous inquiries exist, renders `// NO PREVIOUS INQUIRIES` in muted monospace.
- **Evidence Inspector**: When no inquiry has run, shows a book icon and message: *"Awaiting Inquiry — Supporting transcript passages... will appear here once an inquiry is processed."*
- **Saved Insights Notebook**: Displays a centered notebook illustration, *"Your Notebook Is Empty"*, and instructions for clicking "Save Insight".

#### Error States
- If the backend is unreachable or returns HTTP 502/500, `ErrorState` renders a structured alert banner with an inline "Retry Inquiry" button.
- The sidebar model status indicator switches its pulse dot from green (`online`) to red (`offline`).

---

### 12. Responsive Behavior

- **Mobile Breakpoint (`max-width: 820px`)**:
  - The Navigation Rail shifts to `transform: translateX(-100%)` and acts as a sliding overlay drawer (`.fn-nav-rail.mobile-open`).
  - A mobile hamburger button (`.mobile-nav-toggle`) appears in the canvas header.
  - The Evidence Inspector switches to a full-width overlay drawer when opened.
  - Font sizes and padding scale down gracefully (`--max-reading-width: 100%`).

---

### 13. Accessibility Considerations

1. **Color Contrast**: All primary text pairings exceed WCAG AA 4.5:1 contrast requirements:
   - Light mode: `#20231F` on `#FFFFFF` (14.2:1) and on `#F5F4EF` (12.8:1).
   - Dark mode: `#F0F0E9` on `#1C201B` (13.6:1) and on `#151714` (15.1:1).
2. **Keyboard Focus**: Focusable interactive elements feature explicit `:focus-visible` styling (`outline: 2px solid var(--border-focus); outline-offset: 2px;`).
3. **Screen Readers & ARIA**:
   - `aria-label` provided for icon-only buttons (`mobile-nav-toggle`, citation chips, theme toggle, delete buttons).
   - `ModelSelectorModal` implements `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="modal-title"`.
   - `SourcePanel` implements `aria-label="Evidence Inspector"`.
4. **Reduced Motion**: Honored via `@media (prefers-reduced-motion: reduce)` in `global.css`, reducing animation durations to `0.01ms`.

---

### 14. Usability Trade-Offs & Known UX Limitations

| Design Decision | Intentional Benefit | Usability Trade-Off / Known Limitation | Future Recommendation |
|---|---|---|---|
| **Synchronous Batch Generation** | Ensures complete citations and stable markdown formatting. | User waits 3-4s without seeing streaming tokens. | Implement Server-Sent Events (SSE) streaming token output. |
| **Fixed Right Evidence Drawer** | Allows side-by-side reading of synthesis and original quotes. | Consumes 390px on smaller laptop screens (e.g. 13" MacBook). | Allow drag-to-resize or overlay modal mode on compact screens. |
| **Sandboxed Iframe in Artifact Viewer** | Strict security against XSS from LLM-generated HTML. | Extra DOM layer requiring postMessage or inline style injection for theme synchronization. | Keep iframe sandboxing; enhance with automated PDF export. |
| **Strict Single-Turn LLM Context** | Prevents context pollution and token bloat from prior turns. | Follow-up questions must re-specify topic context if the subject changes drastically. | Add sliding-window multi-turn conversation memory. |
