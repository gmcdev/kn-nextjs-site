'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const HomePage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/art');
  }, [router]);

  return null;
};

export default HomePage;
