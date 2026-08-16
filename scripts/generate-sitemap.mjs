import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteOrigin = 'https://peterson-services.org';
const lastModified = '2026-08-16';
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const escapeXml = (value) => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const absoluteUrl = (path) => new URL(path, `${siteOrigin}/`).href;
const imageEntry = (path) => [
    '    <image:image>',
    `      <image:loc>${escapeXml(absoluteUrl(path))}</image:loc>`,
    '    </image:image>'
].join('\n');

const galleryDataSource = await readFile(resolve(projectRoot, 'js/gallery-data.js'), 'utf8');
const galleryImages = [...new Set(
    [...galleryDataSource.matchAll(/(?:src|poster):\s*'([^']+\.(?:avif|jpe?g|png|webp))'/gi)]
        .map((match) => match[1])
)];
const pages = [
    {
        url: `${siteOrigin}/`,
        images: [
            'hero-copper-country.webp',
            'og-peterson-service.jpg',
            'Assets Peterson/Logo/LOGO-green.png',
            'Assets Peterson/662289297_1497134485741846_309736753562425655_n.jpg'
        ]
    },
    {
        url: `${siteOrigin}/gallery.html`,
        images: galleryImages
    }
];

const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...pages.flatMap((page) => [
        '  <url>',
        `    <loc>${escapeXml(page.url)}</loc>`,
        `    <lastmod>${lastModified}</lastmod>`,
        ...page.images.map(imageEntry),
        '  </url>'
    ]),
    '</urlset>',
    ''
].join('\n');

await writeFile(resolve(projectRoot, 'sitemap.xml'), sitemap, 'utf8');
console.log(`Generated sitemap.xml with ${pages.length} pages and ${pages.reduce((total, page) => total + page.images.length, 0)} images.`);
