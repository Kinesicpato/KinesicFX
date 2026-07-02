module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');
  try {
    const r = await fetch('https://api.frankfurter.app/latest?from=USD&to=CLP',
      { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    return res.status(200).json({ rate: d.rates?.CLP || 920 });
  } catch(e) {
    return res.status(200).json({ rate: 920 });
  }
};
