'use client';

import { useEffect, useMemo } from 'react';

import MediaListener from '@/components/MediaListener';
import PageLayout from '@/components/PageLayout';
import { useSiteData } from '@/components/SiteDataProvider';
import Tag from '@/components/Tag';
import FooterNavigation from '@/components/Site/FooterNavigation';
import useInteractiveFeatures from '@/hooks/useInteractiveFeatures';
import { getRootCategory } from '@/lib/store';
import useNavigationStore from '@/stores/useNavigationStore';
import { getRequestedScopes } from '@/utils/scope-manager';

type TagPageClientProps = Readonly<{
  categorySlug: string;
  tagSlug: string;
}>;

const TagPageClient = ({ categorySlug, tagSlug }: TagPageClientProps) => {
  const { siteScopes, store } = useSiteData();
  const category = store.categoryBySlug[categorySlug];

  const scope = useMemo(() => {
    if (!category) {
      return null;
    }
    const result = getRequestedScopes(siteScopes, category);
    return result?.scope ?? null;
  }, [category, siteScopes]);

  const tag = store.tagBySlug[tagSlug];

  const rootCategorySlug = useMemo(() => {
    if (!category) {
      return categorySlug;
    }
    return getRootCategory(store, category).slug;
  }, [category, categorySlug, store]);

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

  useInteractiveFeatures(store);

  return (
    <MediaListener>
      <PageLayout>
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
