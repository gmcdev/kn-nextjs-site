'use client';

import { useEffect, useMemo, useRef } from 'react';

import findCategoryByPost from '@/components/Breadcrumbs/functions/findCategoryByPost';
import InteractiveFeatures from '@/components/InteractiveFeatures';
import MediaListener from '@/components/MediaListener';
import PageLayout from '@/components/PageLayout';
import Site from '@/components/Site';
import { useSiteData } from '@/components/SiteDataProvider';
import useNavigationStore from '@/stores/useNavigationStore';
import { getRequestedScopes } from '@/utils/scope-manager';

type PostPageClientProps = Readonly<{
  categorySlug: string;
  postSlug: string;
}>;

const PostPageClient = ({ categorySlug, postSlug }: PostPageClientProps) => {
  const { siteScopes, store } = useSiteData();
  const pageRef = useRef<HTMLDivElement>(null);

  const post = useMemo(
    () => Object.values(store.postMap).find((p) => p.slug === postSlug),
    [postSlug, store.postMap],
  );

  const category = useMemo(() => {
    if (!post) {
      return null;
    }
    return findCategoryByPost(store, post) ??
      Object.values(store.categoryMap).find((c) => c.slug === categorySlug) ??
      null;
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

  return (
    <MediaListener>
      <InteractiveFeatures pageRef={pageRef} scope={scope} store={store} />
      <PageLayout pageRef={pageRef}>
        <Site categorySlug={categorySlug} post={post} scope={scope} />
      </PageLayout>
    </MediaListener>
  );
};

export default PostPageClient;
