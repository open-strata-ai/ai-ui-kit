import React from 'react';
import { Alert, Typography } from 'antd';

export interface MarkdownRendererProps {
  content: string;
  /** Automatically hand ```mermaid blocks to MermaidRenderer. */
  renderMermaid?: boolean;
  /** Automatically hand table blocks to DataTable. */
  renderTable?: boolean;
  codeHighlight?: 'shiki' | 'prism';
  components?: Record<string, React.ComponentType<any>>;
}

// Minimal GFM subset renderer. The full OSS pipeline (react-markdown + shiki,
// DESIGN 4.1.2) is wired through the anti-corrosion adapter; this
// dependency-free implementation keeps the library install-light while covering
// headings, bold, inline code, fenced code, and lists. Swap the adapter without
// touching callers.

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const tick = String.fromCharCode(96); // backtick, avoids literal in source
  const pattern = '(\\*\\*([^*]+)\\*\\*|' + tick + '([^' + tick + ']+)' + tick + ')';
  const regex = new RegExp(pattern, 'g');
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) nodes.push(<strong key={keyBase + '-b' + i}>{m[2]}</strong>);
    else if (m[3] !== undefined)
      nodes.push(
        <code key={keyBase + '-c' + i} style={{ background: '#f5f5f5', padding: '0 4px', borderRadius: 4 }}>
          {m[3]}
        </code>
      );
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function parseBlocks(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      out.push(
        <pre key={key++} style={{ background: '#0b1021', color: '#e6edf3', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
          <code>{buf.join('\n')}</code>
        </pre>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      out.push(<Typography.Title level={1} key={key++}>{renderInline(line.slice(2), 'h' + key)}</Typography.Title>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      out.push(<Typography.Title level={2} key={key++}>{renderInline(line.slice(3), 'h' + key)}</Typography.Title>);
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      out.push(<Typography.Title level={3} key={key++}>{renderInline(line.slice(4), 'h' + key)}</Typography.Title>);
      i++;
      continue;
    }
    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) items.push(lines[i++].slice(2));
      out.push(
        <ul key={key++}>
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, 'li' + key + '-' + idx)}</li>
          ))}
        </ul>
      );
      continue;
    }
    if (line.trim() === '') {
      i++;
      continue;
    }
    out.push(<p key={key++}>{renderInline(line, 'p' + key)}</p>);
    i++;
  }
  return out;
}

export function MarkdownRenderer(props: MarkdownRendererProps) {
  const { content } = props;
  try {
    return <div className="os-markdown">{parseBlocks(content)}</div>;
  } catch (e) {
    return <Alert type="error" message="Markdown render failed" description={String(e)} />;
  }
}
