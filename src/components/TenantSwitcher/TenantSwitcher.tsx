import React from 'react';
import { Select } from 'antd';

export interface Tenant {
  id: string;
  name: string;
  /** Optional brand color used for the tenant dot. */
  color?: string;
}

export interface TenantSwitcherProps {
  tenants: Tenant[];
  value?: string;
  onChange?: (id: string) => void;
  /** Disable the control (e.g. while loading). */
  disabled?: boolean;
  className?: string;
}

/**
 * Tenant switcher shared by ai-portal-frontend and ai-admin-frontend.
 * Purely presentational: selection state is owned by the host via `value`/`onChange`.
 */
export function TenantSwitcher({ tenants, value, onChange, disabled, className }: TenantSwitcherProps) {
  return (
    <Select
      className={className}
      value={value}
      disabled={disabled}
      onChange={(id) => onChange?.(id as string)}
      options={tenants.map((t) => ({
        value: t.id,
        label: (
          <span>
            {t.color && (
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: t.color,
                  marginRight: 8,
                }}
              />
            )}
            {t.name}
          </span>
        ),
      }))}
      placeholder="Select tenant"
      style={{ minWidth: 160 }}
    />
  );
}
