'use client';

import { useMemo } from 'react';

import MediaListener from '@/components/MediaListener';
import PageLayout from '@/components/PageLayout';
import Site from '@/components/Site';
import { useSiteData } from '@/components/SiteDataProvider';
import { getRequestedScopes } from '@/utils/scope-manager';

type CategoryPageClientProps = Readonly<{
  categorySlug: string;
}>;

const CategoryPageClient = ({ categorySlug }: CategoryPageClientProps) => {
  const { siteScopes, store } = useSiteData();

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

  if (!category || !scope) {
    return <div>Category not found</div>;
  }

  return (
    <MediaListener>
      <PageLayout>
        <Site categorySlug={categorySlug} scope={scope} />
      </PageLayout>
    </MediaListener>
  );
};

export default CategoryPageClient;
