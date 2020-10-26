const MagazineScheduledContentQuery = require('./queries/content');
const { downloadImages, zipItUp, uploadToS3 } = require('../utils/image-handler');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { retrieveFilterdCompanies } = require('../utils/retrieve-filtered-companies');
const { formatText } = require('../utils/format-text');
const { findCommonArrayValue } = require('../utils/find-common-array-value');
const { channelSectionIds, manufactureCatIds } = require('../id-vars');

const exportName = `export-${Date.now()}.zip`;
const companyLogos = [];

const getNumericalCatId = (company) => {
  const numericalCatIds = [];
  const sectionIds = company.websiteSchedules.map(t => t.section.id);
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(manufactureCatIds)) {
    const inCat = findCommonArrayValue(sectionIds, value);
    if (inCat) numericalCatIds.push(key);
  }
  return numericalCatIds;
};

module.exports = async ({ apollo }) => {
  const allCompanies = await retrieveCompanies(apollo, MagazineScheduledContentQuery);

  const companies = retrieveFilterdCompanies(allCompanies, channelSectionIds);

  companies.sort((a, b) => a.name.localeCompare(b.name));

  const getTaxonomyIds = taxonomy => taxonomy.map(t => t.node.id);
  // Wrap content in paragraph style
  let currentLetter = '#';
  const printContent = arr => arr.map((c) => {
    if (c.companyType !== 'Distributor') return '';

    const companyTaxonomyIds = getTaxonomyIds(c.taxonomy.edges);
    const text = [];
    const companyLetter = c.name.substr(0, 1);
    if (currentLetter !== companyLetter) {
      const regex = /[^A-Z]/g;
      companyLetter.match(regex);
      if (currentLetter.toUpperCase() !== companyLetter.toUpperCase()) {
        if (!companyLetter.match(regex)) {
          currentLetter = companyLetter;
          text.push(`<ParaStyle:cLetter>${currentLetter}`);
        }
      }
    }
    if (companyTaxonomyIds.includes(10376) && c.primaryImage) {
      text.push(`<ParaStyle:cImage>${c.primaryImage.source.name}`);
      const imgPath = `http://media.cygnus.com.s3-website-us-east-1.amazonaws.com/${c.primaryImage.filePath}/original/${c.primaryImage.source.name}`;
      if (!companyLogos.includes(imgPath)) companyLogos.push(imgPath);
    }
    text.push(`<ParaStyle:cName>${formatText(c.name)}`);
    if (c.address1) text.push(`<ParaStyle:cStandard>${c.address1}`);
    if (c.address2) text.push(`<ParaStyle:cStandard>${c.address2}`);
    if (c.cityStateZip) text.push(`<ParaStyle:cStandard>${c.cityStateZip}`);
    if (c.country) text.push(`<ParaStyle:cStandard>${c.country}`);
    if (c.phone) text.push(`<ParaStyle:cStandard>Phone: ${c.phone}`);
    if (c.tollfree) text.push(`<ParaStyle:cStandard>Toll-Free: ${c.tollfree}`);
    if (c.fax) text.push(`<ParaStyle:cStandard>Fax: ${c.fax}`);
    if (c.website) text.push(`<ParaStyle:cStandard>${c.website.replace('https://', '').replace('http://', '')}`);
    if (c.email) text.push(`<ParaStyle:cStandard>${c.email}`);
    text.push(`<ParaStyle:cStandard>${getNumericalCatId(c).join(', ')}`);
    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>',
    '<ParaStyle:Letter>#',
    ...printContent(companies),
  ];
  const cleanLines = lines.filter(e => e);
  if (companyLogos.length !== 0) {
    const tmpDir = `${__dirname}/tmp`;
    // Tempararly download all logs for zipping up.
    await downloadImages(`${tmpDir}/images`, companyLogos);
    // Zip up all logos required for export
    await zipItUp(`${tmpDir}/images`, tmpDir, exportName);
    // push a tmp zip file of image to the S3 server
    uploadToS3('base-cms-exports', 'exports', `${tmpDir}/${exportName}`);

    cleanLines.push(`<ParaStyel:LogoDownloadPath>https://base-cms-exports.s3.amazonaws.com/exports/${exportName}`);
  }

  // @todo port special character filter from php
  return cleanLines.join('\n');
};
