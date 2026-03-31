'use client';

import { useEffect, useMemo, useRef } from 'react';

import InteractiveFeatures from '@/components/InteractiveFeatures';
import MediaListener from '@/components/MediaListener';
import PageLayout from '@/components/PageLayout';
import { useSiteData } from '@/components/SiteDataProvider';
import Tag from '@/components/Tag';
import FooterNavigation from '@/components/Site/FooterNavigation';
import useNavigationStore from '@/stores/useNavigationStore';
import { getRequestedScopes } from '@/utils/scope-manager';

type TagPageClientProps = Readonly<{
  categorySlug: string;
  tagSlug: string;
}>;

const TagPageClient = ({ categorySlug, tagSlug }: TagPageClientProps) => {
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

  const tag = useMemo(
    () => Object.values(store.tagMap).find((t) => t.slug === tagSlug),
    [tagSlug, store.tagMap],
  );

  const rootCategorySlug = useMemo(() => {
    if (!category) {
      return categorySlug;
    }
    let current = category;
    while (current.parentId && store.categoryMap[current.parentId]) {
      current = store.categoryMap[current.parentId];
    }
    return current.slug;
  }, [category, categorySlug, store.categoryMap]);

  const setCurrentCategoryId = useNavigationStore((state) => state.setCurrentCategoryId);
  const setCurrentTagId = useNavigationStore((state) => state.setCurrentTagId);

  useEffect(() => {
    if (category) {
      setCurrentCategoryId(category.id);
    }
    if (tag) {
      setCurrentTagId(tag.id);
    }
  }, [category, tag, setCurrentCategoryId, setCurrentTagId]);

  if (!category || !scope || !tag) {
    return <div>Tag not found</div>;
  }

  return (
    <MediaListener>
      <InteractiveFeatures pageRef={pageRef} store={store} />
      <PageLayout pageRef={pageRef}>
        <div className="feed-content">
          <div className="feed-content__inner">
            <div className="feed-content__category">
              <Tag tag={tag} scope={scope} rootCategorySlug={rootCategorySlug} />
            </div>
          </div>
        </div>
        <FooterNavigation categorySlug={categorySlug} />
      </PageLayout>
    </MediaListener>
  );
};

export default TagPageClient;
