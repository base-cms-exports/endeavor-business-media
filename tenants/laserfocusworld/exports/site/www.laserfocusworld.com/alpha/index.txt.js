const allPublishedContentQuery = require('./queries/content');
const websiteSectionsQuery = require('./queries/sections');
const { downloadImages, zipItUp, uploadToS3 } = require('../utils/image-handler');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { retrieveRootSection } = require('../utils/retrieve-root-section');
const { retrieveFilterdCompanies } = require('../utils/retrieve-filtered-companies');
const { formatText } = require('../utils/format-text');

const exportName = `export-${Date.now()}.zip`;
const companyLogos = [];

module.exports = async ({ apollo }) => {
  const rootSection = await retrieveRootSection(apollo, websiteSectionsQuery, 'directory');
  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery);

  const getTaxonomyIds = taxonomy => taxonomy.map(t => t.node.id);

  // filter out “Bin: legacyStatus:inactive” or “Bin: legacyState:notApproved”
  const excludedNonActiveCompanies = allCompanies.filter(({ taxonomy }) => {
    const taxonomyIds = getTaxonomyIds(taxonomy.edges);
    return !taxonomyIds.includes(2023946) && !taxonomyIds.includes(2023952);
  });
  const companies = retrieveFilterdCompanies(excludedNonActiveCompanies, rootSection);

  companies.sort((a, b) => a.name.localeCompare(b.name));

  const getFormatedInfo = (c, appendedStyleText) => {
    const paraStyle = `<ParaStyle:DirCoAddress${appendedStyleText}>`;
    let info = paraStyle;
    if (c.address1) info = `${info}${formatText(c.address1)}`;
    if (c.address2) info = `${info}, ${formatText(c.address2)}`;
    info = `${info}\n${paraStyle}`;
    info = `${info}${formatText(c.cityStateZip)}, `;
    if (c.country) {
      switch (c.country) {
        case 'United States':
          info = `${info.trim()} USA`;
          break;
        case 'United Kingdom':
          info = `${info.trim()} UK`;
          break;
        default:
          info = `${info.trim()} ${formatText(c.country)}`;
          break;
      }
    }
    return formatText(info.trim().trim(',').trimEnd(', ').trimEnd(','));
  };

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    const taxonomyIds = getTaxonomyIds(c.taxonomy.edges);
    let appendedStyleText = '';
    // if the Directory Export: Logo Bin is set
    if (taxonomyIds.includes(2024381)) {
      appendedStyleText = `${appendedStyleText}Logo`;
    }
    // if the Directory Export: Ad Bin is set
    if (taxonomyIds.includes(2024382)) {
      appendedStyleText = `${appendedStyleText}Ad`;
    }
    // if (appendedStyleText !== '') text.push('<ParaStyle:WhiteSpaceStart>');
    if (taxonomyIds.includes(2024381) && c.primaryImage !== null) {
      text.push(`<ParaStyle:Dir${appendedStyleText}>${c.primaryImage.source.name}`);
      const imgPath = `https://cdn.baseplatform.io/${c.primaryImage.filePath}/${c.primaryImage.source.name}`;
      if (!companyLogos.includes(imgPath)) companyLogos.push(imgPath);
    }
    text.push(`<ParaStyle:DirCoName${appendedStyleText}>${formatText(c.name)}`);
    const info = getFormatedInfo(c, appendedStyleText, taxonomyIds);
    if (info) text.push(info);
    if (c.phone) text.push(`<ParaStyle:DirCoAddress${appendedStyleText}>PH: ${c.phone}`);
    if ((taxonomyIds.includes(2024381) || taxonomyIds.includes(2024382)) && c.email) text.push(`<ParaStyle:DirCoAddress${appendedStyleText}>${c.email}`);
    if (c.website) text.push(`<ParaStyle:DirCoAddress${appendedStyleText}>${c.website.replace('https://', '').replace('http://', '')}`);
    if (taxonomyIds.includes(2024382)) text.push(`<ParaStyle:AdReference>See ad pAd_Ref_${c.id}`);
    if ((taxonomyIds.includes(2024381) || taxonomyIds.includes(2024382)) && c.body) text.push(`<ParaStyle:DirCoDesc${appendedStyleText}>${c.body}`);
    // if (appendedStyleText !== '') text.push('<ParaStyle:WhiteSpaceEnd>');
    return (text.length !== 0) ? text.join('\n') : '';
  });

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
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

    lines.push(`<ParaStyel:LogoDownloadPath>https://base-cms-exports.s3.amazonaws.com/exports/${exportName}`);
  }

  // @todo port special character filter from php
  return cleanLines.join('\n');
};
