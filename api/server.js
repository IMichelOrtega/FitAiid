// =====================================================
// FITNESS NEWS API — Para FitAiid
// Deploy en Railway: https://railway.app
// =====================================================

const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const NodeCache = require('node-cache');

const app = express();
const parser = new Parser({ timeout: 10000 });
const cache = new NodeCache({ stdTTL: 1800 }); // Cache 30 min

app.use(cors({
  origin: ['https://www.fitaiid.com', 'https://fitaiid.com']
}));

// ── FUENTES RSS GRATUITAS ─────────────────────────
const FUENTES = [
  { nombre: 'Healthline Fitness', url: 'https://www.healthline.com/rss/fitness' },
  { nombre: 'Healthline Nutrición', url: 'https://www.healthline.com/rss/nutrition' },
  { nombre: 'Bodybuilding.com', url: 'https://www.bodybuilding.com/rss/articles' },
];

// ── FUNCIÓN: obtener artículos de una fuente ──────
async function obtenerArticulos(fuente) {
  try {
    const feed = await parser.parseURL(fuente.url);
    return feed.items.slice(0, 3).map(item => ({
      title: item.title || '',
      source: { name: fuente.nombre },
      publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
      url: item.link || '',
      urlToImage: extraerImagen(item),
    }));
  } catch {
    return [];
  }
}

function extraerImagen(item) {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item['media:content']?.$?.url) return item['media:content'].$.url;
  if (item['media:thumbnail']?.$?.url) return item['media:thumbnail'].$.url;

  const html = item['content:encoded'] || item.content || item.summary || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];

  return null;
}

// ── ENDPOINT PRINCIPAL ────────────────────────────
app.get('/api/news', async (req, res) => {
  try {
    let articles = cache.get('noticias');

    if (!articles) {
      const resultados = await Promise.allSettled(FUENTES.map(obtenerArticulos));
      articles = [];
      resultados.forEach(r => { if (r.status === 'fulfilled') articles.push(...r.value); });
      articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      cache.set('noticias', articles);
    }

    const pageSize = parseInt(req.query.pageSize) || 6;
    res.json({ status: 'ok', articles: articles.slice(0, pageSize) });

  } catch (error) {
    res.status(500).json({ status: 'error', articles: [] });
  }
});

// Health check para Railway
app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ FitAiid API corriendo en puerto ${PORT}`));
