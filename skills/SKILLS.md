# ai-ui-kit · Coding skills (SKILLS)

> Component API specifications (Props/Slots/Events), theme customization, accessibility and internationalization (a11y/i18n). Source of fact: `design/DESIGN.md`.

## 1. Component API specification

All components follow the same convention:
- **Data Downstream**: Pure props injection, component **no side effects network calls**; streaming content driven by controlled `messages` / `content` + `streaming` flags.
- **Event upstream**: `on*` callback (events); user actions such as tool invocation, submission, skin change, etc. are exposed to the host as events.
- **Slots**: React implements slot coverage through `components` / `renderXxx` / `children`.
- **Version Contract**: The component props type is with the library version SemVer, and the destructive change bump `MAJOR` is accompanied by ADR.

### 1.1 Dialogue (Chat) coding rules

```typescript
//Message role enum
export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;            //Markdown / with mermaid/table code block
  streaming?: boolean;        //Is the output still streaming?
  toolCalls?: ToolCall[];     //Tool call (for display)
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
  /** slot：Override renderer */
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

**rule**:
- `messages` is a controlled list, the host manages the status.
- Streaming messages are driven by the `streaming: true` flag + `content` incremental update. The component's `useEffect` detects changes and uses `requestAnimationFrame` to render smoothly.
- The `components` slot implements renderer replaceability and follows the open-closed principle.
- The `onToolCall` callback returns a custom ReactNode that supports custom UI called by the host injection tool.

### 1.2 Table class (DataTable + DataList) coding rules

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
  virtualized?: boolean;          //Virtual scrolling (large data volumes)
  pagination?: false | { pageSize: number };
  density?: 'compact' | 'default' | 'comfortable';
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;        //Slot: empty
  loading?: boolean;
}
```

**rule**:
- When `virtualized` is `true`, `@tanstack/react-virtual` is used internally to render rows in the viewport, and the number of DOM does not increase with the amount of data.
- `density` maps to antd Table `size` attribute: `compact → small`, `default → middle`, `comfortable → large`.
- When the `empty` slot is not provided, the `<EmptyState />` component is rendered by default.

### 1.3 Renderer class (Markdown / Mermaid / Chart) coding rules

```typescript
export interface MermaidRendererProps {
  code: string;
  theme?: 'default' | 'dark';     //Following OsProvider, it can be covered
  onError?: (err: Error) => void;
}

export interface MarkdownRendererProps {
  content: string;                //Support GFM
  renderMermaid?: boolean;        //Default true
  renderTable?: boolean;          //Default true
  codeHighlight?: 'shiki' | 'prism';  //Default shiki
  components?: Record<string, React.ComponentType<any>>;
}
```

**rule**:
- `MarkdownRenderer` automatically recognizes ````mermaid` code blocks and renders them through `MermaidRenderer` (when `renderMermaid=true`).
- Table blocks (`|...|` GFM syntax) are automatically rendered via `DataTable` (when `renderTable=true`).
- `MermaidRenderer` uses `useEffect` + dynamic `import('mermaid')` for lazy loading to avoid SSR hydration issues.
- The `onError` callback is called when a rendering exception occurs, and the downgrade placeholder (`<pre>{code}</pre>`) is displayed inside the component.

### 1.4 Coding rules for orchestration and governance (Guide/Admin)

```typescript
export interface CapabilityCardProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;              //controlled tick
  dependsOn?: string[];          //Automatically expand pre-dependencies
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

**rule**:
- When `dependsOn` of `CapabilityCard` is selected, the unchecked pre-dependencies will be automatically expanded, and `disabled + tooltip` will prompt "dependencies need to be enabled first".
- In `ChangePreview`, `added` is rendered as a green label, `reused` is rendered as blue, and `removed` is rendered as a red strikethrough.

### 1.5 General coding rules

| Rules | Description |
| --- | --- |
| Pure display | All components are **forbidden** to directly send fetch/axios network requests |
| Type export | The props type of each component is independently exported through `Component.types.ts` |
| Controlled priority | The state is managed by the host (`value`/`onChange` mode), and only pure presentation state is retained internally |
| Slot mode | Prefer using `components` objects and `renderXxx` callbacks to avoid hardcoding subcomponents |
| Composition > Inheritance | Complex components are built by composing basic components. It is forbidden to use `extends` to inherit component classes |
| Default values ​​| Provide reasonable default values ​​for all optional props, falling back to built-in tokens when not wrapped in `OsProvider` |
| Named export | Each component uses named export and provides barrel re-export |
| Side Effects | Only allow `useEffect` for subscription/cleanup, not for data retrieval |

---
## 2. Theme and customizability

The theme system meets two types of customization needs: **Brand customization during development** and **Tenant reskinning during operation**.

### 2.1 Customization during development period

```tsx
//Deliver topics through OsProvider
<OsProvider theme={{
  colorPrimary: '#1890ff',
  dark: false,
  density: 'default',
  brand: { streaming: '#52c41a', aiBadge: '#f0f5ff', toolCallBorder: '#d9d9d9' },
}}>
  <ChatThread messages={...} />
</OsProvider>
```

**rule**:
- `OsProvider` internally bridges antd `ConfigProvider`, mapping tokens to antd `ThemeConfig`.
- Support antd algorithm: `theme={{ algorithm: theme.darkAlgorithm }}` to switch dark mode.

### 2.2 Tenant skin change during runtime

```typescript
//Management Portal distributes brand colors according to tenants
function applyTenantTheme(tenantId: string, brandColor: string) {
  const root = document.querySelector(`[data-os-theme="${tenantId}"]`) || document.documentElement;
  root.style.setProperty('--os-color-primary', brandColor);
}
```

**rule**:
- CSS variables are written to `document.documentElement.style.setProperty` without re-rendering the entire tree.
- Support multi-tenant same-page isolation: scoped through `data-os-theme="tenant-a"` attribute.
- Dark mode: `dark` flag toggle antd `darkAlgorithm` + in-library CSS variable mapping.

### 2.3 Partial coverage

Individual components accept `theme` / `className` / `style` and support the `components` slot replacement renderer. Downgrade compatibility: fallback to built-in default token when `OsProvider` is not wrapped.

---
## 3. Accessibility and internationalization (a11y/i18n)

### 3.1 Accessibility (a11y)

| Requirements | Implementation Rules |
| --- | --- |
| **Semantic roles** | Dialog area uses `role="log"` + `aria-live="polite"` (streaming incremental broadcast); thinking chain folding `aria-expanded`; table `role="grid"` / column header `aria-sort` |
| **Keyboard accessible** | Message input `Ctrl/Cmd+Enter` to send; `↑/↓` to switch history; all interactions can be tab focused, and the focus ring color comes from `colorPrimary` |
| **Contrast** | Default color matching meets WCAG 2.1 AA (text contrast ≥ 4.5:1) |
| **Motion downgrade** | Respect `prefers-reduced-motion`, streaming cursor/typewriter animation can be turned off |
| **Automated Testing** | Each component comes with axe-core automated a11y assertions (zero violations before merging) |

### 3.2 Keyboard Interaction Cheat Sheet

| Component | Button | Behavior |
| --- | --- | --- |
| `MessageComposer` | `Enter` (no modifier keys) | Send message |
| `MessageComposer` | `Shift+Enter` | Line break |
| `DataTable` | `Tab` | Move focus to the next focusable column header |
| `DataTable` | `↑/↓` | Row navigation (when row is focused) |
| `CapabilityCard` | `Space` | Check/Cancel |
| `ChatThread` | `Ctrl/Cmd+Enter` | Send (alternative) |

### 3.3 Internationalization (i18n)

```typescript
//The internal copy of the component uses i18n key, and hard coding is prohibited.
const t = useTranslation('ai-ui-kit');
//Rendering: "Generating..." → t('streaming.generating')

//The host delivers languages ​​uniformly through OsProvider
<OsProvider locale="en">
  <App />
</OsProvider>
```

| Rules | Description |
| --- | --- |
| **Copywriting** | Built-in Chinese/English dictionary, based on `react-i18next` or antd `ConfigProvider.locale` |
| **Hardcoding is prohibited** | The internal copy of the component such as "Generating...", "Stop", "Regenerate", etc. must use i18n key |
| **RTL** | Layout tokenization, supports `direction: rtl` scope |
| **Number/Date** | Formatted by `Intl` (Quota, Token usage, etc.) |
| **Cooperate with the host** | The host delivers the language uniformly through `<OsProvider locale="en">`; the component does not detect the browser language by itself |
| **Dictionary directory** | `src/theme/locales/en.json` / `zh.json` Maintain translation entries |

### 3.4 a11y test rules

```typescript
//Each component story must be accompanied by an ax-core assertion
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no a11y violations', async () => {
  const { container } = render(<ChatThread messages={mockMessages} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---
## Change record

| Version | Date | Description |
| --- | --- | --- |
| v1.0 | 2026-07-17 | Based on `design/DESIGN.md` §3/§5/§6 Extracting skill skeleton (coding rule format) |
