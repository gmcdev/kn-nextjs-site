'use client';

import { useEffect, useMemo, useRef } from 'react';

import MediaListener from '@/components/MediaListener';
import PageLayout from '@/components/PageLayout';
import Site from '@/components/Site';
import { useSiteData } from '@/components/SiteDataProvider';
import useInteractiveFeatures from '@/hooks/useInteractiveFeatures';
import { getLeafCategory } from '@/lib/store';
import useNavigationStore from '@/stores/useNavigationStore';
import { getRequestedScopes } from '@/utils/scope-manager';

type PostPageClientProps = Readonly<{
  categorySlug: string;
  postSlug: string;
}>;

const PostPageClient = ({ categorySlug, postSlug }: PostPageClientProps) => {
  const { siteScopes, store } = useSiteData();
  const pageRef = useRef<HTMLDivElement>(null);

  const post = store.postBySlug[postSlug];

  const category = useMemo(() => {
    if (!post) {
      return null;
    }
    return getLeafCategory(store, post) ?? store.categoryBySlug[categorySlug];
  }, [categorySlug, post, store]);

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
    if (post?.tagIds[0]) {
      setCurrentTagId(post.tagIds[0]);
    }
  }, [category, post, setCurrentCategoryId, setCurrentTagId]);

  if (!post || !scope) {
    return <div>Post not found</div>;
  }

  useInteractiveFeatures(pageRef, store);

  return (
    <MediaListener>
      <PageLayout pageRef={pageRef}>
        <Site categorySlug={categorySlug} post={post} scope={scope} />
      </PageLayout>
    </MediaListener>
  );
};

export default PostPageClient;
