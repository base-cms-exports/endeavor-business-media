const { cleanEnv, makeValidator } = require('envalid');

const nonemptystr = makeValidator((v) => {
  const err = new Error('Expected a non-empty string');
  if (v === undefined || v === null || v === '') {
    throw err;
  }
  const trimmed = String(v).trim();
  if (!trimmed) throw err;
  return trimmed;
});

module.exports = cleanEnv(process.env, {
  AWS_ACCESS_KEY: nonemptystr({ desc: 'AWS Access Key' }),
  AWS_SECRET_ACCESS_KEY: nonemptystr({ desc: 'AWS Secret Access Key' }),
});
