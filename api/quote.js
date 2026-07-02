// api/quote.js — Vercel Serverless Function
// Corre en el servidor de Vercel, sin restricciones CORS
// Uso: /api/quote?ticker=AAPL  o  /api/quote?ticker=AAPL,MSFT,JPM

export default async function handler(req, res) {
  // CORS headers para que el browser pueda llamar
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker requerido' });

  const tickers = ticker.split(',').map(t => t.trim().toUpperCase());
  const results = {};

  await Promise.allSettled(tickers.map(async (t) => {
    try {
      // Yahoo Finance v8 — corre server-side, sin CORS
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=2d`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });
      const data = await r.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        results[t] = {
          price: meta.regularMarketPrice,
          previousClose: meta.previousClose || meta.regularMarketPrice,
          name: meta.longName || meta.shortName || t,
          currency: meta.currency || 'USD',
        };
      }
    } catch (e) {
      console.error(`Error fetching ${t}:`, e.message);
    }
  }));

  return res.status(200).json(results);
}
