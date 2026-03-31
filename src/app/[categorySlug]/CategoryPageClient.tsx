'use client';

import { useEffect, useMemo, useRef } from 'react';

import InteractiveFeatures from '@/components/InteractiveFeatures';
import MediaListener from '@/components/MediaListener';
import PageLayout from '@/components/PageLayout';
import Site from '@/components/Site';
import { useSiteData } from '@/components/SiteDataProvider';
import useNavigationStore from '@/stores/useNavigationStore';
import { getRequestedScopes } from '@/utils/scope-manager';

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
    if (category) {
      setCurrentCategoryId(category.id);
    }
    if (scope?.tags[0]) {
      setCurrentTagId(scope.tags[0].id);
    }
  }, [category, scope, setCurrentCategoryId, setCurrentTagId]);

  if (!category || !scope) {
    return <div>Category not found</div>;
  }

  return (
    <MediaListener>
      <InteractiveFeatures pageRef={pageRef} scope={scope} store={store} />
      <PageLayout pageRef={pageRef}>
        <Site categorySlug={categorySlug} scope={scope} />
      </PageLayout>
    </MediaListener>
  );
};

export default CategoryPageClient;
