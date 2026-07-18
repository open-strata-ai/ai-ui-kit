import React, { createContext, useEffect, useMemo } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { defaultToken, OpenStrataToken } from './tokens';
import { setCssVars } from './css-vars';

export interface OsProviderProps {
  /** Partial theme override, merged onto the default token. */
  theme?: Partial<OpenStrataToken>;
  /** Locale key passed to the host (component copy is i18n-keyed, never hardcoded). */
  locale?: string;
  /** Optional scope for multi-tenant same-page isolation. */
  scope?: string;
  children?: React.ReactNode;
}

const TokenContext = createContext<OpenStrataToken>(defaultToken);

/** Read the currently-active OpenStrata token from context. */
export function useOsToken(): OpenStrataToken {
  return React.useContext(TokenContext);
}

/**
 * Bridges antd's ConfigProvider with OpenStrata design tokens + runtime CSS
 * variables. Singleton by default; can be nested/overridden per scope.
 */
export function OsProvider({ theme, locale, scope, children }: OsProviderProps) {
  const merged = useMemo<OpenStrataToken>(() => ({ ...defaultToken, ...theme }), [theme]);

  useEffect(() => {
    setCssVars(merged, scope);
  }, [merged, scope]);

  const antdThemeConfig = {
    token: {
      colorPrimary: merged.colorPrimary,
      borderRadius: merged.borderRadius,
      fontSize: merged.fontSize,
    },
    algorithm: merged.dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  };

  return (
    <TokenContext.Provider value={merged}>
      <ConfigProvider theme={antdThemeConfig} locale={undefined}>
        <div data-os-theme={scope ?? 'default'}>{children}</div>
      </ConfigProvider>
    </TokenContext.Provider>
  );
}
