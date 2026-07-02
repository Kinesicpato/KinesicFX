module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30');

  const FINNHUB_KEY = 'd93e0ohr01qgqnuaatd0d93e0ohr01qgqnuaatdg';
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker requerido' });

  const tickers = ticker.split(',').map(t => t.trim().toUpperCase());
  const results = {};

  await Promise.allSettled(tickers.map(async (t) => {
    try {
      const r = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${t}&token=${FINNHUB_KEY}`,
        { signal: AbortSignal.timeout(7000) }
      );
      const d = await r.json();
      if (d && d.c && d.c > 0) {
        results[t] = {
          price: d.c,
          previousClose: d.pc || d.c,
          change: d.d || 0,
          changePct: d.dp || 0,
        };
      }
    } catch(e) {}
  }));

  return res.status(200).json(results);
};
