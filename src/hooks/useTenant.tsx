import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CURRENT_TENANT, TenantConfig, generateAISystemPrompt, getSampleVariables } from '@/config/tenant';

interface TenantContextType {
  config: TenantConfig;
  updateConfig: (updates: Partial<TenantConfig>) => void;
  aiSystemPrompt: string;
  sampleVariables: Record<string, string>;
  isLoaded: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const STORAGE_KEY = 'floxbee_tenant_config';

export function TenantProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TenantConfig>(CURRENT_TENANT);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar configurações salvas do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConfig({ ...CURRENT_TENANT, ...parsed });
      } catch (e) {
        console.error('Error parsing tenant config:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Salvar configurações no localStorage quando alteradas
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  }, [config, isLoaded]);

  const updateConfig = (updates: Partial<TenantConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...updates,
      branding: { ...prev.branding, ...updates.branding },
      entity: { ...prev.entity, ...updates.entity },
      ai: { ...prev.ai, ...updates.ai },
      features: { ...prev.features, ...updates.features },
    }));
  };

  const aiSystemPrompt = generateAISystemPrompt(config);
  const sampleVariables = getSampleVariables(config);

  return (
    <TenantContext.Provider value={{ config, updateConfig, aiSystemPrompt, sampleVariables, isLoaded }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
