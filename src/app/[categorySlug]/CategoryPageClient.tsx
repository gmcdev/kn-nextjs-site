'use client';

import { useEffect, useMemo, useRef } from 'react';

import MediaListener from '@/components/MediaListener';
import PageLayout from '@/components/PageLayout';
import Site from '@/components/Site';
import { useSiteData } from '@/components/SiteDataProvider';
import useInteractiveFeatures from '@/hooks/useInteractiveFeatures';
import type { SiteData } from '@/lib/types';
import useNavigationStore from '@/stores/useNavigationStore';
import { getRequestedScopes } from '@/utils/scope-manager';

const getFirstLeaf = (scope: SiteData): SiteData => {
  if (scope.children.length > 0) {
    return getFirstLeaf(scope.children[0]);
  }
  return scope;
};

type CategoryPageClientProps = Readonly<{
  categorySlug: string;
}>;

const CategoryPageClient = ({ categorySlug }: CategoryPageClientProps) => {
  const { siteScopes, store } = useSiteData();
  const pageRef = useRef<HTMLDivElement>(null);

  const category = useMemo(
    () => Object.values(store.categoryMap).find((c) => c.slug === categorySlug),
    [categorySlug, store.categoryMap],
  );

  const scope = useMemo(() => {
    if (!category) {
      return null;
    }
    const result = getRequestedScopes(siteScopes, category);
    return result?.scope ?? null;
  }, [category, siteScopes]);

  const setCurrentCategoryId = useNavigationStore((state) => state.setCurrentCategoryId);
  const setCurrentTagId = useNavigationStore((state) => state.setCurrentTagId);

  useEffect(() => {
    if (scope) {
      const firstLeaf = getFirstLeaf(scope);
      setCurrentCategoryId(firstLeaf.category.id);
      if (firstLeaf.tags[0]) {
        setCurrentTagId(firstLeaf.tags[0].id);
      }
    }
  }, [scope, setCurrentCategoryId, setCurrentTagId]);

  if (!category || !scope) {
    return <div>Category not found</div>;
  }

  useInteractiveFeatures(pageRef, store);

  return (
    <MediaListener>
      <PageLayout pageRef={pageRef}>
        <Site categorySlug={categorySlug} scope={scope} />
      </PageLayout>
    </MediaListener>
  );
};

export default CategoryPageClient;
