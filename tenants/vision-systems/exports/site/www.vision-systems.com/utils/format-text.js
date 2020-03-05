const formatText = (t) => {
  if (t === null) {
    return null;
  }
  let text = t;
  const trans = [];
  trans.push({ from: 'ä', to: '<0x00E4>' });
  trans.push({ from: 'è', to: '<0x00E8>' });
  trans.push({ from: 'é', to: '<0x00E9>' });
  trans.push({ from: 'ü', to: '<0x00FC>' });
  trans.push({ from: 'É', to: '<0x00C9>' });
  trans.push({ from: '&#39;', to: "'" });
  trans.push({ from: '&quot', to: '"' });
  trans.push({ from: '&hellip;', to: '<0x2026>' });
  trans.push({ from: '&frac14;', to: '<0x00BC>' });
  trans.push({ from: '&frac12;', to: '<0x00BD>' });
  trans.push({ from: '&frac34;', to: '<0x00BE>' });
  trans.push({ from: '&lsquo;', to: '<0x2018>' });
  trans.push({ from: '&rsquo;', to: '<0x2019>' });
  trans.push({ from: '&ldquo;', to: '<0x201C>' });
  trans.push({ from: '&rdquo;', to: '<0x201D>' });
  trans.push({ from: '&bull;', to: '<0x2022>' });
  trans.push({ from: '|0x2022|', to: '<0x2022>' });
  trans.push({ from: '&ndash;', to: '<0x2013>' });
  trans.push({ from: '&mdash;', to: '<0x2014>' });
  trans.push({ from: '&trade;', to: '<0x2122>' });
  trans.push({ from: '&copy;', to: '<0x00A9>' });
  trans.push({ from: '&reg;', to: '<0x00AE>' });
  trans.push({ from: '&deg;', to: '<0x00B0>' });
  trans.push({ from: '\\', to: '\\\\' });
  // eslint-disable-next-line no-useless-escape
  trans.push({ from: '&lt;', to: '\<' });
  // eslint-disable-next-line no-useless-escape
  trans.push({ from: '&gt;', to: '\>' });
  trans.forEach((tran) => {
    text = text.replace(tran.from, tran.to);
  });

  return text.trim();
};

module.exports = { formatText };
