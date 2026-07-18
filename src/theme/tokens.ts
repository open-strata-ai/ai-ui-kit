// Design token contract (DESIGN §1.2). Compatible with antd v5 ThemeConfig and
// extended with OpenStrata brand tokens consumed only by ai-ui-kit components.

/** CSS variable name prefix used for runtime per-tenant skinning. */
export const CSS_VAR_PREFIX = '--os' as const;

export interface OpenStrataToken {
  /** Brand main color (seed), default OpenStrata blue. */
  colorPrimary: string;
  /** Border radius base (seed). */
  borderRadius: number;
  /** Font size base (seed). */
  fontSize: number;
  /** Whether dark mode is active. */
  dark?: boolean;
  /** Component-level density. */
  density?: 'compact' | 'default' | 'comfortable';
  /** Brand tokens consumed only by ai-ui-kit components (do not pollute antd). */
  brand: {
    /** Streaming cursor / thinking-chain highlight color. */
    streaming: string;
    /** "AI generated" badge background color. */
    aiBadge: string;
    /** Tool call card border. */
    toolCallBorder: string;
  };
}

export const defaultToken: OpenStrataToken = {
  colorPrimary: '#2f6bff',
  borderRadius: 8,
  fontSize: 14,
  dark: false,
  density: 'default',
  brand: {
    streaming: '#7c3aed',
    aiBadge: '#eef2ff',
    toolCallBorder: '#d6e0ff',
  },
};
