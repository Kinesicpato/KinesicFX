// api/lookup.js — Vercel Serverless Function
// Devuelve nombre, sector, precio y dividendo de un ticker
// Uso: /api/lookup?ticker=AAPL

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker requerido' });

  const t = ticker.trim().toUpperCase();

  try {
    // Yahoo Finance quoteSummary — trae todo de una vez
    const url = `https://query1.finance.yahoo.com/v11/finance/quoteSummary/${t}?modules=summaryProfile,summaryDetail,price`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    const data = await r.json();
    const result = data?.quoteSummary?.result?.[0];

    if (!result) {
      return res.status(404).json({ error: 'Ticker no encontrado' });
    }

    const profile = result.summaryProfile || {};
    const detail  = result.summaryDetail  || {};
    const price   = result.price           || {};

    // Mapear sector de Yahoo a nuestros sectores
    const SECTOR_MAP = {
      'Technology':           'Technology',
      'Financial Services':   'Financials',
      'Healthcare':           'Healthcare',
      'Energy':               'Energy',
      'Communication Services':'Telecom',
      'Consumer Cyclical':    'Consumer',
      'Consumer Defensive':   'Consumer',
      'Industrials':          'Industrials',
      'Basic Materials':      'Industrials',
      'Real Estate':          'Real Estate',
      'Utilities':            'Energy',
    };

    const rawSector = profile.sector || '';
    const sector = SECTOR_MAP[rawSector] || rawSector || 'Technology';
    const divRate = detail.dividendRate?.raw || 0;
    const currentPrice = price.regularMarketPrice?.raw || detail.previousClose?.raw || 0;
    const name = price.longName || price.shortName || t;

    return res.status(200).json({
      ticker: t,
      name,
      sector,
      price: currentPrice,
      annualDividend: divRate,
      exchange: price.exchangeName || '',
      type: 'stock',
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
