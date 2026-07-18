export interface ToolCall {
  id: string;
  name: string;
  args: unknown;
  status: 'pending' | 'running' | 'done' | 'error';
  result?: unknown;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  /** Markdown, possibly containing mermaid/table code blocks. */
  content: string;
  /** Is the output still streaming? */
  streaming?: boolean;
  /** Tool calls attached to this message (for display). */
  toolCalls?: ToolCall[];
  createdAt: number;
}

export interface ChatThreadProps {
  /** Controlled message list. */
  messages: ChatMessage[];
  /** Global streaming switch (default true). */
  streaming?: boolean;
  /** Waiting for first token. */
  loading?: boolean;
  /** Slot overrides for sub-renderers. */
  components?: {
    mermaid?: React.ComponentType<{ code: string }>;
    table?: React.ComponentType<{ data: unknown[] }>;
    markdown?: React.ComponentType<{ content: string }>;
  };
  /** User submits a message. */
  onSend?: (text: string) => void;
  /** Custom tool-call card renderer. */
  onToolCall?: (tool: ToolCall) => React.ReactNode;
  /** Stop the current streaming generation. */
  onStop?: () => void;
  /** Regenerate the previous assistant message. */
  onRegenerate?: (messageId: string) => void;
  className?: string;
}
