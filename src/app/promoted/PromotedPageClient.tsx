'use client';

import { useEffect } from 'react';

import MediaListener from '@/components/MediaListener';
import PageLayout from '@/components/PageLayout';
import { useSiteData } from '@/components/SiteDataProvider';
import Tag from '@/components/Tag';
import useInteractiveFeatures from '@/hooks/useInteractiveFeatures';
import { getRootCategory } from '@/lib/store';
import useNavigationStore from '@/stores/useNavigationStore';

const PromotedPageClient = () => {
  const { promotedScopes, store } = useSiteData();
  const setCurrentCategoryId = useNavigationStore((state) => state.setCurrentCategoryId);
  const setCurrentTagId = useNavigationStore((state) => state.setCurrentTagId);

  useEffect(() => {
    if (promotedScopes.length > 0) {
      const firstScope = promotedScopes[0];
      setCurrentCategoryId(firstScope.category.id);
      if (firstScope.tags[0]) {
        setCurrentTagId(firstScope.tags[0].id);
      }
    }
  }, [promotedScopes, setCurrentCategoryId, setCurrentTagId]);

  useInteractiveFeatures(store);

  if (promotedScopes.length === 0) {
    return <div>No promoted content</div>;
  }

  return (
    <MediaListener>
      <PageLayout>
        <div className="feed-content">
          <div className="feed-content__inner">
            {promotedScopes.map((scope) => {
              const rootCategorySlug = getRootCategory(store, scope.category).slug;
              return (
                <div key={scope.category.id} className="feed-content__category">
                  {scope.tags.map((tag) => (
                    <Tag
                      key={tag.id}
                      tag={tag}
                      scope={scope}
                      rootCategorySlug={rootCategorySlug}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </PageLayout>
    </MediaListener>
  );
};

export default PromotedPageClient;
