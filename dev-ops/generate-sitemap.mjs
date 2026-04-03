import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = 'https://kingnitram.com/site';
const PROJECT_ROOT = join(import.meta.dirname, '..');
const CACHE_PATH = join(PROJECT_ROOT, '.wp-cache.json');
const OUTPUT_PATH = join(PROJECT_ROOT, 'out', 'sitemap.xml');

const cache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
const { categories, posts, tags } = cache;

// Build category ID → category lookup
const categoryMap = {};
categories.forEach((c) => { categoryMap[c.id] = c; });

// Find leaf category for a post (deepest in hierarchy)
const getLeafCategory = (post) => {
  const postCategories = post.categoryIds.map((id) => categoryMap[id]).filter(Boolean);
  const topLevel = [];
  const children = [];
  postCategories.forEach((c) => {
    if (!c.parentId) {
      topLevel.push(c);
    } else {
      children.push(c);
    }
  });
  return children[0] ?? topLevel[0];
};

const urls = [];

// Category pages
categories.forEach((category) => {
  urls.push({ loc: `${BASE_URL}/${category.slug}`, priority: '0.8', changefreq: 'weekly' });
});

// Post pages (at /{leafCategory}/{postSlug})
posts.forEach((post) => {
  const leaf = getLeafCategory(post);
  if (leaf) {
    urls.push({ loc: `${BASE_URL}/${leaf.slug}/${post.slug}`, priority: '0.5', changefreq: 'monthly' });
  }
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

writeFileSync(OUTPUT_PATH, xml);
console.log(`Sitemap generated: ${urls.length} URLs → ${OUTPUT_PATH}`);
