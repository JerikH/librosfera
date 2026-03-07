const express = require('express');
const router = express.Router();
const Libro = require('../../Database/models/libroModel');

const SITE_URL = 'https://librosfera.jerik.dev';

const staticPages = [
  { url: '/Home',                            changefreq: 'daily',  priority: '1.0' },
  { url: '/libros',                          changefreq: 'daily',  priority: '0.9' },
  { url: '/libros/destacados',               changefreq: 'weekly', priority: '0.8' },
  { url: '/libros/descuentos',               changefreq: 'daily',  priority: '0.8' },
  { url: '/libros/categoria/Ficción',        changefreq: 'weekly', priority: '0.7' },
  { url: '/libros/categoria/No Ficción',     changefreq: 'weekly', priority: '0.7' },
  { url: '/libros/categoria/Ciencia',        changefreq: 'weekly', priority: '0.7' },
  { url: '/libros/categoria/Historia',       changefreq: 'weekly', priority: '0.7' },
  { url: '/libros/categoria/Tecnología',     changefreq: 'weekly', priority: '0.7' },
  { url: '/libros/categoria/Romance',        changefreq: 'weekly', priority: '0.7' },
  { url: '/libros/categoria/Fantasía',       changefreq: 'weekly', priority: '0.7' },
  { url: '/libros/categoria/Biografía',      changefreq: 'weekly', priority: '0.7' },
  { url: '/libros/categoria/Ciencia Ficción',changefreq: 'weekly', priority: '0.7' },
];

router.get('/sitemap.xml', async (req, res) => {
  try {
    const books = await Libro.find(
      {},
      { _id: 1, titulo: 1, updatedAt: 1 }
    ).lean();

    const today = new Date().toISOString().split('T')[0];

    const staticEntries = staticPages
      .map(
        (page) => `
  <url>
    <loc>${SITE_URL}${encodeURI(page.url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
      )
      .join('');

    const bookEntries = books
      .map((book) => {
        const lastmod = book.updatedAt
          ? new Date(book.updatedAt).toISOString().split('T')[0]
          : today;
        return `
  <url>
    <loc>${SITE_URL}/libro/${book._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${bookEntries}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generando sitemap:', error);
    res.status(500).json({ error: 'Error generando sitemap' });
  }
});

module.exports = router;
