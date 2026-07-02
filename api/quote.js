// api/quote.js
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30');

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker requerido' });

  const tickers = ticker.split(',').map(t => t.trim().toUpperCase());
  const results = {};

  await Promise.allSettled(tickers.map(async (t) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=2d`;
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      });
      const data = await r.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        results[t] = {
          price: meta.regularMarketPrice,
          previousClose: meta.previousClose || meta.regularMarketPrice,
          name: meta.longName || meta.shortName || t,
        };
      }
    } catch(e) {}
  }));

  return res.status(200).json(results);
};
