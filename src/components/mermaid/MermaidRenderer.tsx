import React, { useEffect, useRef, useState } from 'react';
import { Alert } from 'antd';

export interface MermaidRendererProps {
  /** Mermaid source code. */
  code: string;
  theme?: 'default' | 'dark';
  onError?: (err: Error) => void;
}

/**
 * Mermaid renderer via the anti-corrosion adapter. `mermaid` is loaded lazily
 * and degrades to a plain <pre> when the optional dependency is not installed,
 * so the library builds and runs without forcing the heavy diagram dependency.
 */
export function MermaidRenderer({ code, theme = 'default', onError }: MermaidRendererProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod: any = await import('mermaid');
        const mermaid = mod.default ?? mod;
        mermaid.initialize({ startOnLoad: false, theme });
        const { svg } = await mermaid.render(`os-mermaid-${Date.now()}`, code);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err.message);
        onError?.(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, theme, onError]);

  if (error) {
    return <Alert type="warning" message={`Mermaid unavailable (is 'mermaid' installed?): ${error}`} />;
  }
  return <div ref={ref} className="os-mermaid" style={{ textAlign: 'center' }} />;
}
