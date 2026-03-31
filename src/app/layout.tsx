import type { Metadata } from 'next';
import { Montserrat, Merriweather } from 'next/font/google';

import SiteDataProvider from '@/components/SiteDataProvider';
import { getSiteData } from '@/lib/data';
import '@/css/normalize.css';
import '@/css/style.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-merriweather',
  display: 'swap',
});

const metadata: Metadata = {
  title: 'King Nitram & the Merry Universe',
  description: 'Portfolio site for art and music',
};

export { metadata };

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const RootLayout = async ({ children }: RootLayoutProps) => {
  const { siteScopes, store } = await getSiteData();

  return (
    <html lang="en" className={`${montserrat.variable} ${merriweather.variable}`}>
      <body>
        <SiteDataProvider siteScopes={siteScopes} store={store}>
          {children}
        </SiteDataProvider>
      </body>
    </html>
  );
};

export default RootLayout;
