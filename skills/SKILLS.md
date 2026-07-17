# ai-ui-kit · 编码技能（SKILLS）

> 组件 API 规范（Props / Slots / Events）、主题定制化、无障碍与国际化（a11y / i18n）。事实源：`design/DESIGN.md`。

## 1. 组件 API 规范

所有组件遵循统一约定：
- **数据下行**：纯 props 注入，组件**无副作用网络调用**；流式内容通过受控 `messages` / `content` + `streaming` 标志驱动。
- **事件上行**：`on*` 回调（events）；工具调用、提交、换肤等用户动作以事件暴露给宿主。
- **插槽（Slots）**：React 通过 `components` / `renderXxx` / `children` 实现插槽式覆盖。
- **版本契约**：组件 props 类型随库版本 SemVer，破坏性变更 bump `MAJOR` 并附 ADR。

### 1.1 对话类（Chat）编码规则

```typescript
// 消息角色枚举
export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;            // Markdown / 含 mermaid/table 代码块
  streaming?: boolean;        // 是否仍在流式输出
  toolCalls?: ToolCall[];     // 工具调用（展示用）
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
  /** 插槽：覆盖渲染器 */
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
}
```

**规则**：
- `messages` 为受控列表，宿主管理状态。
- 流式消息通过 `streaming: true` 标志 + `content` 增量更新驱动，组件的 `useEffect` 检测变化后用 `requestAnimationFrame` 平滑渲染。
- `components` 插槽实现渲染器可替换，遵循开放-封闭原则。
- `onToolCall` 回调返回自定义 ReactNode，支持宿主注入工具调用的自定义 UI。

### 1.2 表格类（DataTable + DataList）编码规则

```typescript
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
  virtualized?: boolean;          // 虚拟滚动（大数据量）
  pagination?: false | { pageSize: number };
  density?: 'compact' | 'default' | 'comfortable';
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;        // 插槽：空态
  loading?: boolean;
}
```

**规则**：
- `virtualized` 为 `true` 时，内部使用 `@tanstack/react-virtual` 渲染视口内行，dom 数量不随数据量增长。
- `density` 映射到 antd Table `size` 属性：`compact → small`、`default → middle`、`comfortable → large`。
- `empty` 插槽未提供时，默认渲染 `<EmptyState />` 组件。

### 1.3 渲染器类（Markdown / Mermaid / Chart）编码规则

```typescript
export interface MermaidRendererProps {
  code: string;
  theme?: 'default' | 'dark';     // 跟随 OsProvider，可覆盖
  onError?: (err: Error) => void;
}

export interface MarkdownRendererProps {
  content: string;                // 支持 GFM
  renderMermaid?: boolean;        // 默认 true
  renderTable?: boolean;          // 默认 true
  codeHighlight?: 'shiki' | 'prism';  // 默认 shiki
  components?: Record<string, React.ComponentType<any>>;
}
```

**规则**：
- `MarkdownRenderer` 自动识别 ` ```mermaid ` 代码块并通过 `MermaidRenderer` 渲染（当 `renderMermaid=true`）。
- 表格块（`|...|` GFM 语法）自动通过 `DataTable` 渲染（当 `renderTable=true`）。
- `MermaidRenderer` 使用 `useEffect` + 动态 `import('mermaid')` 懒加载，避免 SSR 水合问题。
- 渲染异常时调用 `onError` 回调，组件内部显示降级占位（`<pre>{code}</pre>`）。

### 1.4 编排治理类（Guide / Admin）编码规则

```typescript
export interface CapabilityCardProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;              // 受控勾选
  dependsOn?: string[];          // 自动展开前置依赖
  recommended?: boolean;
  onChange?: (id: string, checked: boolean) => void;
}

export interface ChangePreviewProps {
  plan: {
    added: string[];
    reused: string[];
    removed: string[];
  };
  onConfirm?: () => void;
  onCancel?: () => void;
}
```

**规则**：
- `CapabilityCard` 的 `dependsOn` 被选中时，自动展开未被勾选的前置依赖，以 `disabled + tooltip` 提示"需先启用依赖"。
- `ChangePreview` 中 `added` 渲染为绿色标签、`reused` 为蓝色、`removed` 为红色删除线。

### 1.5 通用编码规则

| 规则 | 说明 |
| --- | --- |
| 纯展示 | 所有组件**禁止**直接发 fetch/axios 网络请求 |
| 类型导出 | 每个组件的 props 类型通过 `Component.types.ts` 独立导出 |
| 受控优先 | 状态由宿主管理（`value`/`onChange` 模式），内部仅保留纯演示态 |
| 插槽模式 | 优先使用 `components` 对象和 `renderXxx` 回调，避免硬编码子组件 |
| 组合 > 继承 | 复杂组件通过组合基础组件构建，禁止使用 `extends` 继承组件类 |
| 默认值 | 所有可选 props 提供合理默认值，未包裹 `OsProvider` 时回退到内置令牌 |
| 命名导出 | 每个组件使用 named export，同时提供 barrel re-export |
| 副作用 | 仅允许 `useEffect` 用于订阅/清理，禁止用于数据获取 |

---
## 2. 主题与可定制化

主题系统满足两类定制需求：**开发期品牌定制**与**运行期租户换肤**。

### 2.1 开发期定制

```tsx
// 通过 OsProvider 下发主题
<OsProvider theme={{
  colorPrimary: '#1890ff',
  dark: false,
  density: 'default',
  brand: { streaming: '#52c41a', aiBadge: '#f0f5ff', toolCallBorder: '#d9d9d9' },
}}>
  <ChatThread messages={...} />
</OsProvider>
```

**规则**：
- `OsProvider` 内部桥接 antd `ConfigProvider`，将令牌映射为 antd `ThemeConfig`。
- 支持 antd 算法：`theme={{ algorithm: theme.darkAlgorithm }}` 切换暗色模式。

### 2.2 运行期租户换肤

```typescript
// 管理 Portal 按租户下发品牌色
function applyTenantTheme(tenantId: string, brandColor: string) {
  const root = document.querySelector(`[data-os-theme="${tenantId}"]`) || document.documentElement;
  root.style.setProperty('--os-color-primary', brandColor);
}
```

**规则**：
- CSS 变量写入 `document.documentElement.style.setProperty`，无需重渲染整树。
- 支持多租户同页隔离：通过 `data-os-theme="tenant-a"` 属性作用域限定。
- 暗色模式：`dark` 标志切换 antd `darkAlgorithm` + 库内 CSS 变量映射。

### 2.3 局部覆盖

单个组件接受 `theme` / `className` / `style`，并支持 `components` 插槽替换渲染器。降级兼容：未包裹 `OsProvider` 时回退到内置默认令牌。

---
## 3. 无障碍与国际化（a11y / i18n）

### 3.1 无障碍（a11y）

| 要求 | 实现规则 |
| --- | --- |
| **语义角色** | 对话区用 `role="log"` + `aria-live="polite"`（流式增量播报）；思维链折叠 `aria-expanded`；表格 `role="grid"` / 列头 `aria-sort` |
| **键盘可达** | 消息输入 `Ctrl/Cmd+Enter` 发送；`↑/↓` 历史切换；所有交互可 Tab 聚焦，焦点环颜色来自 `colorPrimary` |
| **对比度** | 默认配色满足 WCAG 2.1 AA（正文对比 ≥ 4.5:1） |
| **动效降级** | 尊重 `prefers-reduced-motion`，流式光标/打字机动画可关闭 |
| **自动测试** | 每个组件附带 axe-core 自动化 a11y 断言（零违规方可合并） |

### 3.2 键盘交互速查表

| 组件 | 按键 | 行为 |
| --- | --- | --- |
| `MessageComposer` | `Enter`（无修饰键） | 发送消息 |
| `MessageComposer` | `Shift+Enter` | 换行 |
| `DataTable` | `Tab` | 移动焦点到下一可聚焦列头 |
| `DataTable` | `↑/↓` | 行导航（聚焦行时） |
| `CapabilityCard` | `Space` | 勾选/取消 |
| `ChatThread` | `Ctrl/Cmd+Enter` | 发送（备选） |

### 3.3 国际化（i18n）

```typescript
// 组件内部文案走 i18n key，禁止硬编码
const t = useTranslation('ai-ui-kit');
// 渲染："正在生成…" → t('streaming.generating')

// 宿主通过 OsProvider 统一下发语言
<OsProvider locale="en">
  <App />
</OsProvider>
```

| 规则 | 说明 |
| --- | --- |
| **文案** | 内置中/英词典，基于 `react-i18next` 或 antd `ConfigProvider.locale` |
| **禁止硬编码** | 组件内部文案如"正在生成…""停止""重新生成"等必须走 i18n key |
| **RTL** | 布局令牌化，支持 `direction: rtl` 作用域 |
| **数字/日期** | 经 `Intl` 格式化（配额、Token 用量等） |
| **与宿主协同** | 宿主通过 `<OsProvider locale="en">` 统一下发语言；组件不自行探测浏览器语言 |
| **字典目录** | `src/theme/locales/en.json` / `zh.json` 维护翻译条目 |

### 3.4 a11y 测试规则

```typescript
// 每个组件故事必须附带 axe-core 断言
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no a11y violations', async () => {
  const { container } = render(<ChatThread messages={mockMessages} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---
## 变更记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-07-17 | 基于 `design/DESIGN.md` §3/§5/§6 提取技能骨架（编码规则格式） |
