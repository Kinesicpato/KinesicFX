module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');

  const FINNHUB_KEY = 'd93e0ohr01qgqnuaatd0d93e0ohr01qgqnuaatdg';
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker requerido' });

  const t = ticker.trim().toUpperCase();

  const SECTOR_MAP = {
    'Technology':'Technology','Financial Services':'Financials','Finance':'Financials',
    'Health Technology':'Healthcare','Health Care':'Healthcare','Healthcare':'Healthcare',
    'Energy Minerals':'Energy','Energy':'Energy','Communications':'Telecom',
    'Consumer Non-Durables':'Consumer','Consumer Services':'Consumer',
    'Consumer Durables':'Consumer','Retail Trade':'Consumer',
    'Industrial Services':'Industrials','Producer Manufacturing':'Industrials',
    'Process Industries':'Industrials','Transportation':'Industrials',
    'Utilities':'Energy','Real Estate':'Real Estate','Finance - Real Estate':'Real Estate',
  };

  try {
    const [profileRes, quoteRes, metricsRes] = await Promise.allSettled([
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${t}&token=${FINNHUB_KEY}`,
        { signal: AbortSignal.timeout(7000) }),
      fetch(`https://finnhub.io/api/v1/quote?symbol=${t}&token=${FINNHUB_KEY}`,
        { signal: AbortSignal.timeout(7000) }),
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${t}&metric=all&token=${FINNHUB_KEY}`,
        { signal: AbortSignal.timeout(7000) }),
    ]);

    const profile = profileRes.status === 'fulfilled' ? await profileRes.value.json() : {};
    const quote   = quoteRes.status   === 'fulfilled' ? await quoteRes.value.json()   : {};
    const metrics = metricsRes.status === 'fulfilled' ? await metricsRes.value.json() : {};

    if (!profile || !profile.name) {
      return res.status(404).json({ error: 'Ticker no encontrado' });
    }

    const sector    = SECTOR_MAP[profile.finnhubIndustry] || profile.finnhubIndustry || 'Technology';
    const price     = quote.c || 0;
    const annualDiv = metrics?.metric?.dividendPerShareAnnual || 0;

    return res.status(200).json({
      ticker:         t,
      name:           profile.name,
      sector,
      price,
      annualDividend: annualDiv,
      exchange:       profile.exchange || '',
      type:           'stock',
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
