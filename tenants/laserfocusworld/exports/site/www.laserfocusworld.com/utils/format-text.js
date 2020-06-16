const replaceCharacter = (t, from, to) => {
  let text = t.replace(from, to);
  if (text.includes(from)) text = replaceCharacter(text, from, to);
  return text;
};
const formatText = (t) => {
  if (t === null) {
    return null;
  }
  // https://www.compart.com/en/unicode/U+00E3
  let text = t;
  const trans = [];
  trans.push({ from: '&nbsp;', to: ' ' });
  trans.push({ from: '  ', to: ' ' });
  trans.push({ from: '  ,  ', to: ', ' });
  trans.push({ from: ' , ', to: ', ' });
  trans.push({ from: 'ä', to: '<0x00E4>' });
  trans.push({ from: 'Ä', to: '<0x00C4>' });
  trans.push({ from: 'â', to: '<0x00E2>' });
  trans.push({ from: 'ã', to: '<0x00E3>' });
  trans.push({ from: 'å', to: '<0x00E5>' });
  trans.push({ from: 'æ', to: '<0x00E6>' });
  trans.push({ from: 'ß', to: '<0x00DF>' });
  trans.push({ from: 'ç', to: '<0x00E7>' });
  trans.push({ from: 'è', to: '<0x00E8>' });
  trans.push({ from: 'é', to: '<0x00E9>' });
  trans.push({ from: 'ê', to: '<0x00EA>' });
  trans.push({ from: 'ï', to: '<0x00EF>' });
  trans.push({ from: 'í', to: '<0x00ED>' });
  trans.push({ from: 'É', to: '<0x00C9>' });
  trans.push({ from: 'ñ', to: '<0x00F1>' });
  trans.push({ from: 'ó', to: '<0x00F3>' });
  trans.push({ from: 'ö', to: '<0x00F6>' });
  trans.push({ from: 'š', to: '<0x0161>' });
  trans.push({ from: 'ú', to: '<0x00FA>' });
  trans.push({ from: 'ú', to: '<0x00FA>' });
  trans.push({ from: 'ü', to: '<0x00FC>' });
  trans.push({ from: 'Ü', to: '<0x00DC>' });
  trans.push({ from: '&#39;', to: "'" });
  trans.push({ from: '&quot', to: '"' });
  trans.push({ from: '&hellip;', to: '<0x2026>' });
  trans.push({ from: '&frac14;', to: '<0x00BC>' });
  trans.push({ from: '&frac12;', to: '<0x00BD>' });
  trans.push({ from: '&frac34;', to: '<0x00BE>' });
  trans.push({ from: '&lsquo;', to: '<0x2018>' });
  trans.push({ from: '’', to: '<0x2019>' });
  trans.push({ from: '&rsquo;', to: '<0x2019>' });
  trans.push({ from: '“', to: '<0x201C>' });
  trans.push({ from: '&ldquo;', to: '<0x201C>' });
  trans.push({ from: '”', to: '<0x201D>' });
  trans.push({ from: '&rdquo;', to: '<0x201D>' });
  trans.push({ from: '&bull;', to: '<0x2022>' });
  trans.push({ from: '|0x2022|', to: '<0x2022>' });
  trans.push({ from: '&ndash;', to: '<0x2013>' });
  trans.push({ from: '&mdash;', to: '<0x2014>' });
  trans.push({ from: '&trade;', to: '<0x2122>' });
  trans.push({ from: '&copy;', to: '<0x00A9>' });
  trans.push({ from: '®', to: '<0x00AE>' });
  trans.push({ from: '&reg;', to: '<0x00AE>' });
  trans.push({ from: '&deg;', to: '<0x00B0>' });
  trans.push({ from: '\\', to: '\\\\' });
  // eslint-disable-next-line no-useless-escape
  trans.push({ from: '&lt;', to: '\<' });
  // eslint-disable-next-line no-useless-escape
  trans.push({ from: '&gt;', to: '\>' });
  trans.forEach((tran) => {
    if (text.includes(tran.from)) text = replaceCharacter(text, tran.from, tran.to);
  });

  return text.trim();
};

module.exports = { formatText };
