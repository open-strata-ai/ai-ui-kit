# ai-ui-kit · Specification Contract (SPECS)

> Complete matrix of component classification, complete specifications of Props API, build/release/version strategy. Source of fact: `design/DESIGN.md`.

## 1. Complete matrix of component classification

The 10 categories of AI UI patterns in §4.1.2 of the architecture document are fully covered and supplemented with the required orchestration governance components of §13/§14. Total 13 categories, 30+ components.

| # | Classification | Components | Underlying Implementation | Architecture Mapping | Status |
| --- | --- | --- | --- | --- | --- |
| A | **Chat** | `ChatThread` `MessageList` `MessageBubble` `MessageComposer` `StreamingText` `ToolCallCard` | assistant-ui + Vercel AI SDK | §4.1.2 Chat/Streaming; §13.4 MVP Chat UI | core |
| B | **Thinking Chain Thinking** | `ThinkingProcess` | Self-developed | §4.1.2 Thinking Chain Display | core |
| C | **Table** | `DataTable` | TanStack Table + antd | §4.1.2 Table; §14 Management Portal table view | core |
| D | **List List** | `DataList` `VirtualList` `EmptyState` | antd List + Virtual Scroll | §4.1.2 List; §14 Resource/User List | core |
| E | **Mermaid diagram** | `MermaidRenderer` | mermaid.js | §4.1.2 Mermaid; §13/§14 Architecture diagram rendering | core |
| F | **Markdown** | `MarkdownRenderer` | react-markdown + rehype + shiki | §4.1.2 Markdown/code highlighting | core |
| G | **Code Highlight** | `CodeBlock` | shiki/prism | §4.1.2 Code Highlighting | core |
| H | **Data Visualization** | `ChartCard` | Recharts / ECharts | §4.1.2 Data Visualization | core |
| I | **Rich Text Editing** | `PromptEditor` | Tiptap | §4.1.2 Rich Text Editing | core |
| J | **File Upload** | `FileDropzone` | react-dropzone | §4.1.2 File Upload | core |
| K | **Form** | `AIForm` `FormField` | antd Form (extension) | §13.1 Capability card/form; §14.3 User form | core |
| L | **Guide Portal Orchestration** | `CapabilityCard` `ChangePreview` `StatusBoard` | Self-developed (based on antd + basic components) | §13.1 Capability Card/Change Preview/Status Board | core |
| M | **Management Portal Governance** | `ResourceUsage` `TenantCard` `UserTable` `QuotaEditor` | Self-developed (based on C/D/K class components) | §14.2–§14.5 Tenant/user/resource management | core |

### 1.1 Component dependencies

```
CapabilityCard ──> antd Card / Checkbox
ChangePreview  ──> antd Tag / List / Modal
StatusBoard    ──> ChartCard / DataTable
ResourceUsage  ──> ChartCard / DataTable
TenantCard     ──> antd Card / Statistic
UserTable      ──> DataTable
QuotaEditor    ──> antd Slider / InputNumber / FormField
```

---
## 2. Props API complete specifications

### 2.1 Dialogue class

```typescript
// --- ChatThread ---
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  streaming?: boolean;
  toolCalls?: ToolCall[];
  createdAt: number;
}

export interface ToolCall {
  id: string;
  name: string;
  args: unknown;
  status: 'pending' | 'running' | 'done' | 'error';
  result?: unknown;
}

export interface ChatThreadProps {
  messages: ChatMessage[];
  streaming?: boolean;
  loading?: boolean;
  components?: {
    mermaid?: React.ComponentType<{ code: string }>;
    table?: React.ComponentType<{ data: unknown[] }>;
    thinking?: React.ComponentType<{ steps: ThinkingStep[] }>;
    markdown?: React.ComponentType<{ content: string }>;
  };
  onSend?: (text: string) => void;
  onToolCall?: (tool: ToolCall) => React.ReactNode;
  onStop?: () => void;
  onRegenerate?: (messageId: string) => void;
  className?: string;
  density?: 'compact' | 'default' | 'comfortable';
}

// --- ThinkingProcess ---
export interface ThinkingStep {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'running' | 'done';
  collapsed?: boolean;
}

export interface ThinkingProcessProps {
  steps: ThinkingStep[];
  defaultExpanded?: boolean;
  className?: string;
}
```

### 2.2 Data container class

```typescript
// --- DataTable ---
export interface DataTableColumn<T> {
  key: keyof T & string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: keyof T & string;
  virtualized?: boolean;
  pagination?: false | { pageSize: number };
  density?: 'compact' | 'default' | 'comfortable';
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  loading?: boolean;
}

// --- DataList ---
export interface DataListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  virtualized?: boolean;
  itemHeight?: number;
  loading?: boolean;
  empty?: React.ReactNode;
}

// --- EmptyState ---
export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}
```

### 2.3 Renderer class

```typescript
// --- MermaidRenderer ---
export interface MermaidRendererProps {
  code: string;
  theme?: 'default' | 'dark';
  onError?: (err: Error) => void;
  className?: string;
}

// --- MarkdownRenderer ---
export interface MarkdownRendererProps {
  content: string;
  renderMermaid?: boolean;
  renderTable?: boolean;
  codeHighlight?: 'shiki' | 'prism';
  components?: Record<string, React.ComponentType<any>>;
}

// --- CodeBlock ---
export interface CodeBlockProps {
  code: string;
  language?: string;
  highlight?: 'shiki' | 'prism';
  showLineNumbers?: boolean;
  maxHeight?: number;
}

// --- ChartCard ---
export type ChartType = 'line' | 'bar' | 'pie' | 'area';

export interface ChartCardProps {
  type: ChartType;
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  title?: string;
  height?: number;
  loading?: boolean;
}
```

### 2.4 Editing and uploading classes

```typescript
// --- PromptEditor (Tiptap) ---
export interface PromptEditorProps {
  value?: string;
  placeholder?: string;
  onChange?: (markdown: string) => void;
  readOnly?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
}

// --- FileDropzone ---
export interface FileDropzoneProps {
  accept?: Record<string, string[]>;   //MIME type
  maxSize?: number;                     // bytes
  maxFiles?: number;
  onUpload?: (files: File[]) => void;
  onError?: (err: Error) => void;
  disabled?: boolean;
}
```

### 2.5 Forms and Governance Classes

```typescript
// --- AIForm ---
export interface FormFieldSchema {
  key: string;
  type: 'text' | 'number' | 'select' | 'switch' | 'textarea';
  label: string;
  required?: boolean;
  options?: { label: string; value: string }[],
  defaultValue?: unknown;
  placeholder?: string;
}

export interface AIFormProps {
  schema: FormFieldSchema[];
  values?: Record<string, unknown>;
  onSubmit?: (values: Record<string, unknown>) => void;
  onValuesChange?: (changed: Record<string, unknown>, all: Record<string, unknown>) => void;
  readonly?: boolean;
}

// --- ResourceUsage ---
export interface ResourceUsageProps {
  resources: {
    name: string;
    allocated: number;
    used: number;
    quota: number;
    unit: string;
  }[];
  loading?: boolean;
}

// --- TenantCard ---
export interface TenantCardProps {
  tenant: {
    id: string;
    name: string;
    domain?: string;
    brandColor?: string;
    status: 'active' | 'inactive' | 'provisioning';
  };
  onEdit?: (id: string) => void;
  onDisable?: (id: string) => void;
}
```

---
## 3. Build/release/version strategy

### 3.1 Build

- **Builder**: Rollup (multi-entry, dual-format ESM/CJS, `.d.ts` by `tsc --emitDeclarationOnly` + `api-extractor`).
- **CI**: Each repository is independent `.github` (build/test/scan/publish).
- **Product Verification**: `peerDependencies` and `exports` mapping are used to make consistency assertions in CI.

### 3.2 Product format

| Format | Table of Contents | Oriented |
| --- | --- | --- |
| ESM | `esm/` | Modern packager (Vite/Webpack/Turbopack) |
| CJS | `cjs/` | Compatible with old toolchains |
| Types | `types/` | TypeScript type declaration |

### 3.3 Version Strategy (SemVer)

- **LIBRARY VERSION**: Follow `MAJOR.MINOR.PATCH`. Baseline alignment platform v1.4.0, the first version is released as `1.4.0`, and subsequent increments will be independent at its own pace.
- **Breaking changes**: props contract breaking changes bump `MAJOR`, recording an ADR in `design/adr/`.
- **Interface Version**: The `openstrata.interfaceVersion` field of `package.json` declares the minimum compatible interface version (such as `UiKit: 1.0.0`).
- **BOM pinned version**: The library version is pinned by `openstrata-meta/bom.yaml` / `repos.yaml`; upgrading the library version must synchronize the meta repository.

### 3.4 CI Checklist

| Check items | Tools | Blocking conditions |
| --- | --- | --- |
| Type checking | `tsc --noEmit` | Any type errors |
| Unit Test | Vitest | Coverage < 85% or failed |
| Visual regression | Playwright + Chromatic | Screenshot difference beyond threshold |
| a11y | ax-core | any violation |
| Contract testing | Self-developed script | `exports` is inconsistent with the product |
| Dependency audit | `npm audit` | high/critical vulnerabilities |
| BOM consistency | CI script | Version does not match meta repository |

### 3.5 Release process

```
src/ components+token
  │
  ▼
Rollup Multi-entry build
  │
  ├──> esm/   ──┐
  ├──> cjs/   ──┼──> npm publish @openstrata/ai-ui-kit
  └──> types/ ──┘           │
                             ▼
                     Motakura bom.yaml nailed version (tag v1.4.0)
                             │
                             ▼
                   portal / admin / guide Consumption
```

### 3.6 License

Library ontology MIT. The dependent OSSs are all OSI compatible (assistant-ui MIT, mermaid MIT, TanStack MIT, react-markdown MIT, Tiptap MIT, Recharts MIT, react-dropzone MIT, shiki MIT), and the `core` that meets §16 must be OSI constrained.

---
## Change record

| Version | Date | Description |
| --- | --- | --- |
| v1.0 | 2026-07-17 | Extract specification skeleton based on `design/DESIGN.md` §2/§7/§3 |
