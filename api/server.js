const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const NodeCache = require('node-cache');

const app = express();
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; FitAiid RSS Reader)'
  }
});
const cache = new NodeCache({ stdTTL: 1800 });

app.use(cors({
  origin: ['https://www.fitaiid.com', 'https://fitaiid.com']
}));

const FUENTES = [
  {
    nombre: "Men's Health",
    url: 'https://www.menshealth.com/rss/all.xml/',
    imagen: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80'
  },
  {
    nombre: "Runner's World",
    url: 'https://www.runnersworld.com/rss/all.xml/',
    imagen: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80'
  },
  {
    nombre: 'Healthline Fitness',
    url: 'https://www.healthline.com/rss/fitness',
    imagen: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80'
  },
  {
    nombre: 'Healthline Nutrición',
    url: 'https://www.healthline.com/rss/nutrition',
    imagen: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80'
  },
  {
    nombre: 'Bodybuilding.com',
    url: 'https://www.bodybuilding.com/rss/articles',
    imagen: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'
  },
  {
    nombre: 'Breaking Muscle',
    url: 'https://breakingmuscle.com/feed/',
    imagen: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80'
  },
  {
    nombre: 'Fitness Blender',
    url: 'https://www.fitnessblender.com/articles/rss',
    imagen: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80'
  },
];

function extraerImagen(item, imagenFallback) {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item['media:content']?.$?.url) return item['media:content'].$.url;
  if (item['media:thumbnail']?.$?.url) return item['media:thumbnail'].$.url;
  const html = item['content:encoded'] || item.content || item.summary || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];
  return imagenFallback;
}

async function obtenerArticulos(fuente) {
  try {
    const feed = await parser.parseURL(fuente.url);
    return feed.items.slice(0, 3).map(item => ({
      title: item.title || '',
      source: { name: fuente.nombre },
      publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
      url: item.link || '',
      urlToImage: extraerImagen(item, fuente.imagen),
    }));
  } catch (err) {
    console.log(`[FAIL] ${fuente.nombre}: ${err.message}`);
    return [];
  }
}

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

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ FitAiid API corriendo en puerto ${PORT}`));