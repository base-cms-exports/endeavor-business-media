const allPublishedCopanyContentQuery = require('./queries/company');
const { downloadImages, zipItUp } = require('../utils/image-handler');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { formatText } = require('../utils/format-text');

const exportName = `export-${Date.now()}.zip`;
const companyLogos = [];

// let currentLetter = '#';
module.exports = async ({ apollo }) => {
  const companies = await retrieveCompanies(apollo, allPublishedCopanyContentQuery, '60f6ec0bd28860bc3384daa1');

  companies.sort((a, b) => a.name.localeCompare(b.name));

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    // const companyLetter = c.name.substr(0, 1);
    // if (currentLetter !== companyLetter) {
    //   const regex = /[^A-Z]/g;
    //   companyLetter.match(regex);
    //   if (currentLetter.toUpperCase() !== companyLetter.toUpperCase()) {
    //     if (!companyLetter.match(regex)) {
    //       currentLetter = companyLetter;
    //       text.push(`<ParaStyle:AlphaHead>${currentLetter}`);
    //     }
    //   }
    // }
    const isAdvertiser = (c.labels && (c.labels.includes('Buyers Guide Advertiser') || c.labels.includes('Buyers Guide Microsite')));
    const pStyle = isAdvertiser ? 'BGRedAdvertiser' : 'BG MAN CO. BOLD';
    text.push(`<ParaStyle:${pStyle}>${formatText(c.name)}`);
    if (isAdvertiser) text.push('<ParaStyle:BGRedAdPage>See ad page');
    const cityState = [];
    if (c.city) cityState.push(c.city);
    if (c.state) cityState.push(c.state);
    const line1 = [];
    if (cityState.length) line1.push(cityState.join(', '));
    const phone = c.tollfree ? c.tollfree : c.phone;
    if (phone) line1.push(phone);
    if (line1.length) text.push(`<ParaStyle:BG MAN BODY>${formatText(line1.join(' &bull; '))}`);
    if (c.website) text.push(`<ParaStyle:BG MAN BODY>${c.website.replace('https://', '').replace('http://', '')}`);
    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    // '<ParaStyle:AlphaHead>123',
    ...printContent(companies),
  ];
  const cleanLines = lines.filter(e => e);

  if (companyLogos.length !== 0) {
    const tmpDir = `${__dirname}/tmp`;
    // Tempararly download all logs for zipping up.
    await downloadImages(`${tmpDir}/images`, companyLogos);
    // Zip up all logos required for export
    zipItUp(`${tmpDir}/images`, tmpDir, exportName);
    // push a tmp zip file of image to the S3 server
    // uploadToS3('base-cms-exports', 'exports', `${tmpDir}/${exportName}`);

    // cleanLines.push(`<ParaStyel:LogoDownloadPath>https://base-cms-exports.s3.amazonaws.com/exports/${exportName}`);
  }

  // @todo port special character filter from php
  return cleanLines.join('\n');
};
