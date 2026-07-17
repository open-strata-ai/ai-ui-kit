# ai-ui-kit · 架构文档（ARCH）

> 设计令牌体系、组件清单与分类、目录结构与导出策略。事实源：`design/DESIGN.md`。

## 1. 定位

`ai-ui-kit` 是 OpenStrata **L9 前端接入层**的"开箱即用 AI 交互组件库"，目标是让企业内部业务前端**零重复开发**地获得一致的 AI UX。不直接接入模型——组件以 **props / 回调** 方式消费数据流，仅负责**渲染与交互**。

- **边界**：只解决"AI 内容如何好看、好用地呈现与交互"；不承载业务逻辑、不直连 LLM、不发网络请求。
- **可选性**：标记为 `core`（必选），被 `ai-portal-frontend`、`ai-admin-frontend`、`ai-guide-portal` 共同依赖。
- **技术基座**：React 18 + TypeScript + Ant Design v5 + Vite + Storybook 8 + Rollup。
- **包名**：`@openstrata/ai-ui-kit`。

---
## 2. 设计令牌体系（Design Tokens）

基于 **Ant Design v5 Design Token** 三层模型（Seed → Map → Alias），叠加一层 **CSS 变量** 支持**运行时按租户换肤**。

### 2.1 令牌流转

```
Seed 种子令牌 ──> Map 映射令牌 ──> Alias 别名令牌 ──> 组件层
(colorPrimary /     (colorPrimaryBg /   (colorText /       (ChatThread /
 borderRadius)      colorPrimaryHover)   colorBgContainer)  DataTable / ...)

CSS 变量层 --os-color-primary 等 ──> 运行时覆盖 Seed / Alias
                                   ──> 租户换肤 [data-os-theme]
```

### 2.2 令牌 TypeScript 契约

```typescript
/** 设计令牌类型（与 antd v5 ThemeConfig 兼容并扩展 OpenStrata 品牌令牌） */
export interface OpenStrataToken {
  /** 品牌主色（seed），默认 OpenStrata 蓝 */
  colorPrimary: string;
  /** 圆角基数（seed） */
  borderRadius: number;
  /** 字号基数（seed） */
  fontSize: number;
  /** 是否暗色模式 */
  dark?: boolean;
  /** 组件级密度：compact | default | comfortable */
  density?: 'compact' | 'default' | 'comfortable';
  /** 品牌令牌（仅 ai-ui-kit 组件消费，不污染 antd 全局） */
  brand: {
    streaming: string;       // 流式光标/思考链高亮色
    aiBadge: string;         // "AI 生成"角标底色
    toolCallBorder: string;  // 工具调用卡片描边
  };
}

/** 运行时换肤 CSS 变量名前缀 */
export const CSS_VAR_PREFIX = '--os' as const;
```

### 2.3 OsProvider

设计令牌由 `<OsProvider theme={...}>` 统一下发（内部桥接 antd `ConfigProvider` + 注入 `:root` CSS 变量），单例、可嵌套覆盖。未包裹 `OsProvider` 时回退到内置默认令牌，保证组件可独立使用。

---
## 3. 组件清单与分类

组件清单**完整覆盖**架构文档 §4.1.2 列出的 10 类 AI UI 模式，并补充引导门户和管理 Portal 所需的编排/治理类组件。

### 3.1 组件分类

| # | 分类 | 组件 | 底层实现 |
| --- | --- | --- | --- |
| A | **对话 Chat** | `ChatThread` / `MessageList` / `MessageBubble` / `MessageComposer` / `StreamingText` / `ToolCallCard` | assistant-ui 基元 + Vercel AI SDK 流式 |
| B | **思维链 Thinking** | `ThinkingProcess`（折叠式推理步骤） | 自研 |
| C | **表格 Table** | `DataTable`（排序/筛选/分页/虚拟滚动） | TanStack Table + antd |
| D | **列表 List** | `DataList` / `VirtualList` / `EmptyState` | antd List + 虚拟滚动 |
| E | **Mermaid 图** | `MermaidRenderer` | mermaid.js |
| F | **Markdown** | `MarkdownRenderer`（GFM + 代码高亮 + 内联 Mermaid/Table） | react-markdown + rehype + shiki |
| G | **代码高亮** | `CodeBlock`（200+ 语言） | shiki / prism |
| H | **数据可视化** | `ChartCard`（折线/柱状/饼，可嵌入 LLM 回复） | Recharts / ECharts |
| I | **富文本编辑** | `PromptEditor`（提示词编辑/文档标注） | Tiptap |
| J | **文件上传** | `FileDropzone`（文档上传预览） | react-dropzone |
| K | **表单 Form** | `AIForm` / `FormField`（Schema 驱动） | antd Form（扩展） |
| L | **引导门户编排** | `CapabilityCard` / `ChangePreview` / `StatusBoard` | 自研（基于 antd + 基础组件） |
| M | **管理 Portal 治理** | `ResourceUsage` / `TenantCard` / `UserTable` / `QuotaEditor` | 自研（基于 C/D/K 类组件） |

### 3.2 架构分层

```
┌──────────────────────────────────────┐
│         入口层 / exports              │
│  index.ts + 每组件独立入口            │
└────────────┬─────────────────────────┘
             │
┌────────────▼─────────────────────────┐
│         编排层 / components           │
│  对话/思维链 | 表格/列表              │
│  Markdown/Mermaid/图表               │
│  引导门户/管理 Portal 编排           │
└────────────┬─────────────────────────┘
             │
┌────────────▼─────────────────────────┐
│         基座层 / primitives + theme   │
│  OsProvider + 设计令牌               │
│  OSS 适配器（防腐层）                 │
│  antd v5 基座                        │
└──────────────────────────────────────┘
```

---
## 4. 目录结构

```
ai-ui-kit/
├── src/
│   ├── index.ts                 # 桶文件（re-export，sideEffects: false）
│   ├── theme/                   # 设计令牌 + OsProvider
│   │   ├── tokens.ts            # OpenStrataToken 类型与默认值
│   │   ├── OsProvider.tsx       # 桥接 antd ConfigProvider + CSS 变量
│   │   └── css-vars.ts          # CSS 变量注入/读取工具
│   ├── primitives/              # 薄封装的外部 OSS 适配器（防腐层）
│   │   ├── mermaid/             # Mermaid.js 适配封装
│   │   ├── tanstack/            # TanStack Table 适配封装
│   │   ├── tiptap/              # Tiptap 编辑器适配封装
│   │   ├── dropzone/            # react-dropzone 适配封装
│   │   └── recharts/            # Recharts/ECharts 适配封装
│   ├── components/              # 业务组件（按 §3.1 分类 A-M）
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
│   └── utils/                   # 流式解析、markdown 分块、a11y 助手
├── stories/                     # Storybook 8 故事
├── tests/                       # 单元 + 视觉 + a11y
├── package.json  rollup.config.mjs  tsconfig.json  .storybook/
├── arch/  design/  skills/  specs/   # 元信息四件套
└── infrastructure/config/       # 本仓 SPI 适配器局部配置片段
```

### 4.1 Tree-shaking 与导出策略

- **多入口（per-component entry）**：`package.json` 的 `exports` 字段为每个组件提供独立子路径（`/chat`、`/table`、`/mermaid` 等），支持按需引入。
- **`sideEffects: false`**：除 theme/CSS 入口外标记无副作用，便于打包器摇树。
- **双格式产物（Rollup）**：`esm/`（现代打包器）、`cjs/`（兼容）、`types/`（`.d.ts`）。

### 4.2 package.json exports 声明

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

`react` / `react-dom` / `antd` 作为 peer（不打包进产物），避免重复 antd 实例与主题冲突。

---
## 5. 组件契约与设计约束

### 5.1 组件契约清单

每个组件必须同时提供 `.types.ts`（Props 类型导出）和 `.tsx`（实现），禁止将 Props 类型内联在实现文件中。

| 组件文件 | 类型文件 | 导出 |
| --- | --- | --- |
| `ChatThread.tsx` | `ChatThread.types.ts` | `ChatThread`, `ChatThreadProps`, `ChatMessage` |
| `DataTable.tsx` | `DataTable.types.ts` | `DataTable`, `DataTableProps`, `DataTableColumn` |
| `MermaidRenderer.tsx` | `MermaidRenderer.types.ts` | `MermaidRenderer`, `MermaidRendererProps` |
| `MarkdownRenderer.tsx` | `MarkdownRenderer.types.ts` | `MarkdownRenderer`, `MarkdownRendererProps` |
| `CapabilityCard.tsx` | `CapabilityCard.types.ts` | `CapabilityCard`, `CapabilityCardProps` |
| ... | ... | ... |

### 5.2 命名约定

| 约定 | 示例 | 说明 |
| --- | --- | --- |
| 组件文件名 | `PascalCase.tsx` | `ChatThread.tsx` |
| 类型文件名 | `PascalCase.types.ts` | `ChatThread.types.ts` |
| Props 接口 | `<Component>Props` | `ChatThreadProps` |
| 导出的非 props 类型 | 与组件名同前缀 | `ChatMessage`, `ChatRole` |
| Story 文件 | `<Component>.stories.tsx` | `ChatThread.stories.tsx` |
| 测试文件 | `<Component>.test.tsx` | `ChatThread.test.tsx` |

### 5.3 消费者导入模式

```typescript
// 方式 1：桶文件全量导入（简单场景）
import { ChatThread, DataTable, MermaidRenderer } from '@openstrata/ai-ui-kit';

// 方式 2：子路径按需导入（推荐，tree-shaking 友好）
import { ChatThread } from '@openstrata/ai-ui-kit/chat';
import { DataTable } from '@openstrata/ai-ui-kit/table';
import { MermaidRenderer } from '@openstrata/ai-ui-kit/mermaid';

// 方式 3：主题单独导入
import { OsProvider, tokens } from '@openstrata/ai-ui-kit/theme';
```

### 5.4 生态对齐矩阵

| 外部 OSS | Primitives 封装路径 | 版本约束 | 许可证 |
| --- | --- | --- | --- |
| mermaid.js | `src/primitives/mermaid/` | `^10` | MIT |
| TanStack Table | `src/primitives/tanstack/` | `^8` | MIT |
| Tiptap | `src/primitives/tiptap/` | `^2` | MIT |
| react-dropzone | `src/primitives/dropzone/` | `^14` | MIT |
| Recharts | `src/primitives/recharts/` | `^2` | MIT |
| shiki | `src/primitives/` (via MarkdownRenderer) | `^1` | MIT |
| assistant-ui | `src/primitives/` (via ChatThread) | latest | MIT |

### 5.5 防腐层设计模式

每个 `primitives/` 下的适配器**仅暴露库所需的子集接口**，不直接透传 OSS 原生 API：

```typescript
// primitives/mermaid/index.ts —— 防腐层示例
import mermaid from 'mermaid';

// 仅暴露 render 方法，隐藏 mermaid 的全局配置/API 细节
export async function renderMermaid(
  code: string,
  theme: 'default' | 'dark' = 'default',
): Promise<{ svg: string }> {
  const { svg } = await mermaid.render('mermaid-svg', code);
  return { svg };
}
```

---
## 变更记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-07-17 | 基于 `design/DESIGN.md` §1/§2/§4 提取架构骨架 |
