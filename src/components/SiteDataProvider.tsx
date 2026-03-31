'use client';

import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';

import type { SiteData, Store } from '@/lib/types';

type SiteDataContextValue = Readonly<{
  siteScopes: SiteData[];
  store: Store;
}>;

const SiteDataContext = createContext<SiteDataContextValue | null>(null);

type SiteDataProviderProps = Readonly<PropsWithChildren<SiteDataContextValue>>;

const SiteDataProvider = ({ children, siteScopes, store }: SiteDataProviderProps) => {
  return (
    <SiteDataContext.Provider value={{ siteScopes, store }}>
      {children}
    </SiteDataContext.Provider>
  );
};

export default SiteDataProvider;

export function useSiteData(): SiteDataContextValue {
  const context = useContext(SiteDataContext);
  if (!context) {
    throw new Error('useSiteData must be used within a SiteDataProvider');
  }
  return context;
}

export function useStore(): Store {
  return useSiteData().store;
}

export function useSiteScopes(): SiteData[] {
  return useSiteData().siteScopes;
}
