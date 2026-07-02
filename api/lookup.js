// api/lookup.js
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker requerido' });

  const t = ticker.trim().toUpperCase();

  const SECTOR_MAP = {
    'Technology':'Technology','Financial Services':'Financials',
    'Healthcare':'Healthcare','Energy':'Energy',
    'Communication Services':'Telecom','Consumer Cyclical':'Consumer',
    'Consumer Defensive':'Consumer','Industrials':'Industrials',
    'Basic Materials':'Industrials','Real Estate':'Real Estate',
    'Utilities':'Energy',
  };

  try {
    const url = `https://query1.finance.yahoo.com/v11/finance/quoteSummary/${t}?modules=summaryProfile,summaryDetail,price`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });
    const data = await r.json();
    const result = data?.quoteSummary?.result?.[0];
    if (!result) return res.status(404).json({ error: 'No encontrado' });

    const profile = result.summaryProfile || {};
    const detail  = result.summaryDetail  || {};
    const price   = result.price           || {};

    return res.status(200).json({
      ticker: t,
      name:          price.longName || price.shortName || t,
      sector:        SECTOR_MAP[profile.sector] || profile.sector || 'Technology',
      price:         price.regularMarketPrice?.raw || 0,
      annualDividend: detail.dividendRate?.raw || 0,
      exchange:      price.exchangeName || '',
      type:          'stock',
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
