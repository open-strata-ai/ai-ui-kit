# ai-ui-kit · 规格契约（SPECS）

> 组件分类完整矩阵、Props API 完整规格、构建/发版/版本策略。事实源：`design/DESIGN.md`。

## 1. 组件分类完整矩阵

架构文档 §4.1.2 的 10 类 AI UI 模式全部覆盖，并补充 §13/§14 所需的编排治理组件。总计 13 类、30+ 组件。

| # | 分类 | 组件 | 底层实现 | 架构映射 | 状态 |
| --- | --- | --- | --- | --- | --- |
| A | **对话 Chat** | `ChatThread` `MessageList` `MessageBubble` `MessageComposer` `StreamingText` `ToolCallCard` | assistant-ui + Vercel AI SDK | §4.1.2 聊天/流式；§13.4 MVP 聊天 UI | core |
| B | **思维链 Thinking** | `ThinkingProcess` | 自研 | §4.1.2 思维链展示 | core |
| C | **表格 Table** | `DataTable` | TanStack Table + antd | §4.1.2 表格；§14 管理 Portal 表格视图 | core |
| D | **列表 List** | `DataList` `VirtualList` `EmptyState` | antd List + 虚拟滚动 | §4.1.2 列表；§14 资源/用户列表 | core |
| E | **Mermaid 图** | `MermaidRenderer` | mermaid.js | §4.1.2 Mermaid；§13/§14 架构图渲染 | core |
| F | **Markdown** | `MarkdownRenderer` | react-markdown + rehype + shiki | §4.1.2 Markdown/代码高亮 | core |
| G | **代码高亮** | `CodeBlock` | shiki / prism | §4.1.2 代码高亮 | core |
| H | **数据可视化** | `ChartCard` | Recharts / ECharts | §4.1.2 数据可视化 | core |
| I | **富文本编辑** | `PromptEditor` | Tiptap | §4.1.2 富文本编辑 | core |
| J | **文件上传** | `FileDropzone` | react-dropzone | §4.1.2 文件上传 | core |
| K | **表单 Form** | `AIForm` `FormField` | antd Form（扩展） | §13.1 能力卡片/表单；§14.3 用户表单 | core |
| L | **引导门户编排** | `CapabilityCard` `ChangePreview` `StatusBoard` | 自研（基于 antd + 基础组件） | §13.1 能力卡片/变更预览/状态看板 | core |
| M | **管理 Portal 治理** | `ResourceUsage` `TenantCard` `UserTable` `QuotaEditor` | 自研（基于 C/D/K 类组件） | §14.2–§14.5 租户/用户/资源管理 | core |

### 1.1 组件依赖关系

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
## 2. Props API 完整规格

### 2.1 对话类

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

### 2.2 数据容器类

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

### 2.3 渲染器类

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

### 2.4 编辑与上传类

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
  accept?: Record<string, string[]>;   // MIME 类型
  maxSize?: number;                     // bytes
  maxFiles?: number;
  onUpload?: (files: File[]) => void;
  onError?: (err: Error) => void;
  disabled?: boolean;
}
```

### 2.5 表单与治理类

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
## 3. 构建 / 发版 / 版本策略

### 3.1 构建

- **构建器**：Rollup（多入口、双格式 ESM/CJS、`.d.ts` 由 `tsc --emitDeclarationOnly` + `api-extractor`）。
- **CI**：每仓独立 `.github`（build / test / scan / publish）。
- **产物校验**：`peerDependencies` 与 `exports` 映射在 CI 中做一致性断言。

### 3.2 产物格式

| 格式 | 目录 | 面向 |
| --- | --- | --- |
| ESM | `esm/` | 现代打包器（Vite/Webpack/Turbopack） |
| CJS | `cjs/` | 兼容旧工具链 |
| Types | `types/` | TypeScript 类型声明 |

### 3.3 版本策略（SemVer）

- **库版本**：遵循 `MAJOR.MINOR.PATCH`。基线对齐平台 v1.4.0，首版发 `1.4.0`，后续按自身节奏独立递增。
- **破坏性变更**：props 契约破坏性改动 bump `MAJOR`，沉淀 ADR 于 `design/adr/`。
- **接口版本**：`package.json` 的 `openstrata.interfaceVersion` 字段声明最低兼容接口版本（如 `UiKit: 1.0.0`）。
- **BOM 钉版本**：库版本被 `openstrata-meta/bom.yaml` / `repos.yaml` 钉死；升级库版本须同步元仓。

### 3.4 CI 检查清单

| 检查项 | 工具 | 阻断条件 |
| --- | --- | --- |
| 类型检查 | `tsc --noEmit` | 任何类型错误 |
| 单元测试 | Vitest | 覆盖率 < 85% 或失败 |
| 视觉回归 | Playwright + Chromatic | 截图差异超阈值 |
| a11y | axe-core | 任何违规 |
| 契约测试 | 自研脚本 | `exports` 与产物不一致 |
| 依赖审计 | `npm audit` | high/critical 漏洞 |
| BOM 一致性 | CI 脚本 | 版本与元仓不符 |

### 3.5 发版流程

```
src/ 组件+令牌
  │
  ▼
Rollup 多入口构建
  │
  ├──> esm/   ──┐
  ├──> cjs/   ──┼──> npm publish @openstrata/ai-ui-kit
  └──> types/ ──┘           │
                             ▼
                     元仓 bom.yaml 钉版本 (tag v1.4.0)
                             │
                             ▼
                   portal / admin / guide 消费
```

### 3.6 许可证

库本体 MIT。依赖 OSS 均为 OSI 兼容（assistant-ui MIT、mermaid MIT、TanStack MIT、react-markdown MIT、Tiptap MIT、Recharts MIT、react-dropzone MIT、shiki MIT），满足 §16 的 `core` 须 OSI 约束。

---
## 变更记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-07-17 | 基于 `design/DESIGN.md` §2/§7/§3 提取规格骨架 |
