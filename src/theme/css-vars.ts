import { CSS_VAR_PREFIX, OpenStrataToken } from './tokens';

// Runtime CSS-variable injection for per-tenant skinning (DESIGN §1.2 / §5).
// Writing to documentElement lets multiple tenants coexist on one page via a
// `data-os-theme` scope without re-rendering the whole tree.

function toVarName(key: string): string {
  return `${CSS_VAR_PREFIX}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
}

export function setCssVars(token: OpenStrataToken, scope?: string): void {
  const root = scope
    ? (document.querySelector(`[data-os-theme="${scope}"]`) as HTMLElement | null) ?? document.documentElement
    : document.documentElement;
  root.style.setProperty(toVarName('colorPrimary'), token.colorPrimary);
  root.style.setProperty(toVarName('borderRadius'), `${token.borderRadius}px`);
  root.style.setProperty(toVarName('fontSize'), `${token.fontSize}px`);
  root.style.setProperty(toVarName('streaming'), token.brand.streaming);
  root.style.setProperty(toVarName('aiBadge'), token.brand.aiBadge);
  root.style.setProperty(toVarName('toolCallBorder'), token.brand.toolCallBorder);
}

export function getCssVars(scope?: string): Record<string, string> {
  const root = scope
    ? (document.querySelector(`[data-os-theme="${scope}"]`) as HTMLElement | null) ?? document.documentElement
    : document.documentElement;
  const out: Record<string, string> = {};
  for (const name of root.style) {
    if (name.startsWith(CSS_VAR_PREFIX)) out[name] = root.style.getPropertyValue(name);
  }
  return out;
}
