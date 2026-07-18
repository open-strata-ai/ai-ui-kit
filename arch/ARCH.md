# ai-ui-kit · Architecture Document (ARCH)

> Design token system, component list and classification, directory structure and export strategy. Source of fact: `design/DESIGN.md`.

## 1. Positioning

`ai-ui-kit` is the "out-of-box AI interactive component library" of OpenStrata's **L9 front-end access layer**. The goal is to allow the enterprise's internal business front-end to obtain a consistent AI UX with **zero duplication of development**. Not directly connected to the model - the component consumes the data stream through **props/callback** and is only responsible for **rendering and interaction**.

- **Boundary**: Only solves "how to present and interact with AI content in a beautiful and useful way"; it does not carry business logic, does not directly connect to LLM, and does not issue network requests.
- **Optional**: Marked as `core` (required), co-dependent by `ai-portal-frontend`, `ai-admin-frontend`, `ai-guide-portal`.
- **Technical Base**: React 18 + TypeScript + Ant Design v5 + Vite + Storybook 8 + Rollup.
- **Package name**: `@openstrata/ai-ui-kit`.

---
## 2. Design Tokens

Based on the **Ant Design v5 Design Token** three-layer model (Seed → Map → Alias), overlaying a layer of **CSS variables** supports **skinning by tenant at runtime**.

### 2.1 Token circulation

```
Seed seed token ──> Map mapping token ──> Alias Alias ​​token ──> component layer
(colorPrimary /     (colorPrimaryBg /   (colorText /       (ChatThread /
 borderRadius)      colorPrimaryHover)   colorBgContainer)  DataTable / ...)

CSS variable layer --os-color-primary wait ──> runtime coverage Seed / Alias
                                   ──> Tenant reskin [data-os-theme]
```

### 2.2 Token TypeScript Contract

```typescript
/** Design token type（and antd v5 ThemeConfig Compatible and extendable OpenStrata brand token） */
export interface OpenStrataToken {
  /** Brand main color（seed），default OpenStrata blue */
  colorPrimary: string;
  /** Fillet base（seed） */
  borderRadius: number;
  /** Font size base（seed） */
  fontSize: number;
  /** Whether dark mode */
  dark?: boolean;
  /** Component level density：compact | default | comfortable */
  density?: 'compact' | 'default' | 'comfortable';
  /** brand token（only ai-ui-kit Component consumption，Does not pollute antd overall situation） */
  brand: {
    streaming: string;       //Streaming cursor/thought chain highlight color
    aiBadge: string;         //"AI generated" corner mark background color
    toolCallBorder: string;  //Tool call card stroke
  };
}

/** Skinning at runtime CSS variable name prefix */
export const CSS_VAR_PREFIX = '--os' as const;
```

### 2.3 OsProvider

Design tokens are issued uniformly by `<OsProvider theme={...}>` (internal bridge antd `ConfigProvider` + inject `:root` CSS variable), singleton, and can be nested and overridden. When `OsProvider` is not wrapped, it falls back to the built-in default token to ensure that the component can be used independently.

---
## 3. Component list and classification

Component List **Complete coverage** of the 10 categories of AI UI patterns listed in §4.1.2 of the architecture document, and supplemented by orchestration/governance-type components required to bootstrap the portal and manage the portal.

### 3.1 Component classification

| # | Classification | Components | Underlying Implementation |
| --- | --- | --- | --- |
| A | **Chat** | `ChatThread` / `MessageList` / `MessageBubble` / `MessageComposer` / `StreamingText` / `ToolCallCard` | assistant-ui primitive + Vercel AI SDK streaming |
| B | **Thinking Chain Thinking** | `ThinkingProcess` (folded reasoning steps) | Self-developed |
| C | **Table** | `DataTable` (sort/filter/paging/virtual scrolling) | TanStack Table + antd |
| D | **List List** | `DataList` / `VirtualList` / `EmptyState` | antd List + Virtual Scroll |
| E | **Mermaid diagram** | `MermaidRenderer` | mermaid.js |
| F | **Markdown** | `MarkdownRenderer` (GFM + code highlighting + inline Mermaid/Table) | react-markdown + rehype + shiki |
| G | **Code Highlighting** | `CodeBlock` (200+ languages) | shiki/prism |
| H | **Data Visualization** | `ChartCard` (line/column/pie, LLM reply can be embedded) | Recharts / ECharts |
| I | **Rich text editing** | `PromptEditor` (prompt editing/document annotation) | Tiptap |
| J | **File upload** | `FileDropzone` (document upload preview) | react-dropzone |
| K | **Form** | `AIForm` / `FormField` (Schema driver) | antd Form (extension) |
| L | **Guide Portal Orchestration** | `CapabilityCard` / `ChangePreview` / `StatusBoard` | Self-developed (based on antd + basic components) |
| M | **Management Portal Governance** | `ResourceUsage` / `TenantCard` / `UserTable` / `QuotaEditor` | Self-developed (based on C/D/K class components) |

### 3.2 Architecture layering

```
┌──────────────────────────────────────┐
│         entrance level / exports              │
│  index.ts + Independent entrance for each component            │
└────────────┬─────────────────────────┘
             │
┌────────────▼─────────────────────────┐
│         orchestration layer / components           │
│  dialogue/Thought chain | sheet/list              │
│  Markdown/Mermaid/chart               │
│  bootstrap portal/manage Portal Orchestration           │
└────────────┬─────────────────────────┘
             │
┌────────────▼─────────────────────────┐
│         base level / primitives + theme   │
│  OsProvider + design token               │
│  OSS adapter（Anti-corrosion layer）                 │
│  antd v5 base                        │
└──────────────────────────────────────┘
```

---
## 4. Directory structure

```
ai-ui-kit/
├── src/
│   ├── index.ts                 #bucket file (re-export, sideEffects: false)
│   ├── theme/                   #Design Token + OsProvider
│   │   ├── tokens.ts            #OpenStrataToken type and default value
│   │   ├── OsProvider.tsx       #Bridging antd ConfigProvider + CSS variables
│   │   └── css-vars.ts          #CSS variable injection/reading tool
│   ├── primitives/              #Thinly packaged external OSS adapter (anti-corrosion layer)
│   │   ├── mermaid/             #Mermaid.js adaptation package
│   │   ├── tanstack/            #TanStack Table adaptation package
│   │   ├── tiptap/              #Tiptap editor adaptation package
│   │   ├── dropzone/            #react-dropzone adaptation package
│   │   └── recharts/            #Recharts/ECharts adaptation package
│   ├── components/              #Business components (classification A-M per §3.1)
│   │   ├── chat/                # ChatThread / MessageList / MessageBubble ...
│   │   ├── thinking/            # ThinkingProcess
│   │   ├── table/               # DataTable
│   │   ├── list/                # DataList / VirtualList / EmptyState
│   │   ├── mermaid/             # MermaidRenderer
│   │   ├── markdown/            # MarkdownRenderer / CodeBlock
│   │   ├── chart/               # ChartCard
│   │   ├── editor/              # PromptEditor
│   │   ├── upload/              # FileDropzone
│   │   ├── form/                # AIForm / FormField
│   │   ├── guide/               # CapabilityCard / ChangePreview / StatusBoard
│   │   ├── admin/               # ResourceUsage / TenantCard / UserTable / QuotaEditor
│   │   └── <Component>/index.tsx + <Component>.types.ts
│   └── utils/                   #Streaming parsing, markdown chunking, a11y assistant
├── stories/                     #Storybook 8 stories
├── tests/                       #unit + vision + a11y
├── package.json  rollup.config.mjs  tsconfig.json  .storybook/
├── arch/  design/  skills/  specs/   #Meta information four-piece set
└── infrastructure/config/       #This repository SPI adapter local configuration fragment
```

### 4.1 Tree-shaking and export strategy

- **Multiple entries (per-component entry)**: The `exports` field of `package.json` provides independent sub-paths (`/chat`, `/table`, `/mermaid`, etc.) for each component, supporting introduction on demand.
- **`sideEffects: false`**: Except for the theme/CSS entry, the mark has no side effects, which is convenient for the packager to shake the tree.
- **Dual format products (Rollup)**: `esm/` (modern packager), `cjs/` (compatible), `types/` (`.d.ts`).

### 4.2 package.json exports statement

```jsonc
{
  "name": "@openstrata/ai-ui-kit",
  "version": "1.4.0",
  "type": "module",
  "sideEffects": ["*.css", "./theme/index.css"],
  "exports": {
    ".": { "types": "./types/index.d.ts", "import": "./esm/index.js" },
    "./chat": { "types": "./types/components/chat.d.ts", "import": "./esm/chat.js" },
    "./table": { "types": "./types/components/table.d.ts", "import": "./esm/table.js" },
    "./mermaid": { "types": "./types/components/mermaid.d.ts", "import": "./esm/mermaid.js" },
    "./theme": { "types": "./types/theme/index.d.ts", "import": "./esm/theme.js" }
  },
  "peerDependencies": { "react": ">=18", "react-dom": ">=18", "antd": ">=5" }
}
```

### 4.3 peerDependencies

`react` / `react-dom` / `antd` acts as a peer (not packaged into the product) to avoid duplicate antd instances and theme conflicts.

---
## 5. Component contracts and design constraints

### 5.1 Component Contract List

Each component must provide both `.types.ts` (Props type export) and `.tsx` (implementation), inlining Props types in implementation files is prohibited.

| Component files | Type files | Export |
| --- | --- | --- |
| `ChatThread.tsx` | `ChatThread.types.ts` | `ChatThread`, `ChatThreadProps`, `ChatMessage` |
| `DataTable.tsx` | `DataTable.types.ts` | `DataTable`, `DataTableProps`, `DataTableColumn` |
| `MermaidRenderer.tsx` | `MermaidRenderer.types.ts` | `MermaidRenderer`, `MermaidRendererProps` |
| `MarkdownRenderer.tsx` | `MarkdownRenderer.types.ts` | `MarkdownRenderer`, `MarkdownRendererProps` |
| `CapabilityCard.tsx` | `CapabilityCard.types.ts` | `CapabilityCard`, `CapabilityCardProps` |
| ... | ... | ... |

### 5.2 Naming Convention

| Convention | Example | Description |
| --- | --- | --- |
| Component file name | `PascalCase.tsx` | `ChatThread.tsx` |
| Type file name | `PascalCase.types.ts` | `ChatThread.types.ts` |
| Props interface | `<Component>Props` | `ChatThreadProps` |
| Exported non-props types | Same prefix as component name | `ChatMessage`, `ChatRole` |
| Story files | `<Component>.stories.tsx` | `ChatThread.stories.tsx` |
| Test files | `<Component>.test.tsx` | `ChatThread.test.tsx` |

### 5.3 Consumer import mode

```typescript
//Method 1: Import all bucket files (simple scenario)
import { ChatThread, DataTable, MermaidRenderer } from '@openstrata/ai-ui-kit';

//Method 2: Import sub-paths on demand (recommended, tree-shaking friendly)
import { ChatThread } from '@openstrata/ai-ui-kit/chat';
import { DataTable } from '@openstrata/ai-ui-kit/table';
import { MermaidRenderer } from '@openstrata/ai-ui-kit/mermaid';

//Method 3: Import the theme individually
import { OsProvider, tokens } from '@openstrata/ai-ui-kit/theme';
```

### 5.4 Ecological Alignment Matrix

| External OSS | Primitives package path | Version constraints | License |
| --- | --- | --- | --- |
| mermaid.js | `src/primitives/mermaid/` | `^10` | MIT |
| TanStack Table | `src/primitives/tanstack/` | `^8` | MIT |
| Tiptap | `src/primitives/tiptap/` | `^2` | MIT |
| react-dropzone | `src/primitives/dropzone/` | `^14` | MIT |
| Recharts | `src/primitives/recharts/` | `^2` | MIT |
| shiki | `src/primitives/` (via MarkdownRenderer) | `^1` | MIT |
| assistant-ui | `src/primitives/` (via ChatThread) | latest | MIT |

### 5.5 Anti-corrosion layer design pattern

Each adapter under `primitives/` only exposes a subset of interfaces required by the library and does not directly transparently transmit the OSS native API:

```typescript
//primitives/mermaid/index.ts - anti-corrosion layer example
import mermaid from 'mermaid';

//Only expose the render method and hide mermaid’s global configuration/API details
export async function renderMermaid(
  code: string,
  theme: 'default' | 'dark' = 'default',
): Promise<{ svg: string }> {
  const { svg } = await mermaid.render('mermaid-svg', code);
  return { svg };
}
```

---
## Change record

| Version | Date | Description |
| --- | --- | --- |
| v1.0 | 2026-07-17 | Extract architecture skeleton based on `design/DESIGN.md` §1/§2/§4 |
