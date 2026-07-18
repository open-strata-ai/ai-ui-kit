import React, { useState } from 'react';
import { Button, Input, List, Space, Tag, Card } from 'antd';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import { ChatMessage, ChatThreadProps, ToolCall } from './types';

function StreamingText({ text, streaming }: { text: string; streaming?: boolean }) {
  return (
    <span>
      {text}
      {streaming && <span className="os-streaming-cursor" style={{ color: 'var(--os-streaming)' }}>▍</span>}
    </span>
  );
}

function ToolCallCard({ tool, override }: { tool: ToolCall; override?: (t: ToolCall) => React.ReactNode }) {
  if (override) return <>{override(tool)}</>;
  const color = tool.status === 'error' ? 'red' : tool.status === 'done' ? 'green' : 'blue';
  return (
    <Card size="small" style={{ borderColor: 'var(--os-tool-call-border)', margin: '4px 0' }}>
      <Space>
        <Tag color={color}>{tool.status}</Tag>
        <code>{tool.name}</code>
      </Space>
    </Card>
  );
}

function MessageBubble({ message, props }: { message: ChatMessage; props: ChatThreadProps }) {
  const isUser = message.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', margin: '8px 0' }}>
      <div style={{ maxWidth: '80%' }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
          {message.role}
          {message.streaming && ' · streaming'}
        </div>
        <div style={{ padding: 10, borderRadius: 8, background: isUser ? 'var(--os-ai-badge)' : '#fff', border: '1px solid #eee' }}>
          {props.components?.markdown ? (
            <props.components.markdown content={message.content} />
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
          {message.streaming && <StreamingText text="" streaming />}
          {message.toolCalls?.map((t) => (
            <ToolCallCard key={t.id} tool={t} override={props.onToolCall} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatThread(props: ChatThreadProps) {
  const { messages, loading, onSend, onStop, streaming = true } = props;
  const [draft, setDraft] = useState('');

  return (
    <div className={props.className} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div role="log" aria-live="polite" style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ padding: 8, color: '#888' }}>Generating…</div>}
        <List
          dataSource={messages}
          locale={{ emptyText: 'No messages yet' }}
          renderItem={(m) => (
            <List.Item style={{ border: 'none', display: 'block' }}>
              <MessageBubble message={m} props={props} />
            </List.Item>
          )}
        />
      </div>
      <Space.Compact style={{ marginTop: 8 }}>
        <Input.TextArea
          value={draft}
          autoSize={{ minRows: 1, maxRows: 4 }}
          placeholder="Type a message… (Ctrl/Cmd+Enter to send)"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && draft.trim()) {
              onSend?.(draft.trim());
              setDraft('');
            }
          }}
        />
        {streaming ? (
          <Button onClick={onStop}>Stop</Button>
        ) : (
          <Button
            type="primary"
            onClick={() => {
              if (draft.trim()) {
                onSend?.(draft.trim());
                setDraft('');
              }
            }}
          >
            Send
          </Button>
        )}
      </Space.Compact>
    </div>
  );
}
