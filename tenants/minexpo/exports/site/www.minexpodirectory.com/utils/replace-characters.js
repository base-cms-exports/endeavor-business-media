const replaceCharacters = (t, from, to) => {
  let text = t.replace(from, to);
  if (text.includes(from)) text = replaceCharacters(text, from, to);
  return text;
};
module.exports = { replaceCharacters };
