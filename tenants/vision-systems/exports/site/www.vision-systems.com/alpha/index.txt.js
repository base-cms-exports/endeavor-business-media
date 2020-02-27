const { getAsArray } = require('@base-cms/object-path');
const paginateQuery = require('@endeavor-business-media/common/paginate-query');
const allPublishedContentQuery = require('./queries/content');
const websiteSectionsQuery = require('./queries/sections');
const { downloadImages, zipItUp, uploadToS3 } = require('../image-handler.js');

const exportName = `export-${Date.now()}.zip`;
const companyLogos = [];

const retrieveRootSection = async (client) => {
  const { data: { websiteSectionAlias } } = await client.query({
    query: websiteSectionsQuery,
    variables: { input: { alias: 'directory' } },
  });
  return websiteSectionAlias;
};

const retrieveCompanies = async (apollo) => {
  const promise = await paginateQuery({
    client: apollo,
    query: allPublishedContentQuery,
    variables: { input: { includeContentTypes: 'Company', pagination: { limit: 250 }, sort: { field: 'name', order: 'asc' } } },
    cursorPath: 'input.pagination.after',
    rootValue: 'allPublishedContent',
  });
  const now = Date.now().valueOf();
  return promise.map((company) => {
    const sectionIds = getAsArray(company, 'websiteSchedules')
      .filter(({ start, end }) => start < now && (!end || end > now))
      .map(({ section }) => section.id);
    return { ...company, sectionIds };
  });
};

const mapHierarchyIds = (sections, sectionIds) => {
  sections.forEach((section) => {
    if (!sectionIds.includes(section.id)) sectionIds.push(section.id);
    const childNodes = getAsArray(section, 'children.edges').map(({ node }) => node);
    if (childNodes.length) mapHierarchyIds(childNodes, sectionIds);
    return sectionIds;
  });
  return sectionIds;
};

const getFilterdCompanies = (allCompanies, rootSection) => {
  const primarySections = getAsArray(rootSection, 'children.edges').map(({ node }) => node);
  const primarySectionsIds = getAsArray(rootSection, 'children.edges').map(({ node }) => node.id);
  const direcotrySectionIds = mapHierarchyIds(primarySections, primarySectionsIds);
  const companies = allCompanies.filter(({ sectionIds }) => {
    const insert = sectionIds.filter(element => direcotrySectionIds.includes(element));
    return insert.length !== 0;
  });
  return companies;
};

module.exports = async ({ apollo }) => {
  const rootSection = await retrieveRootSection(apollo);
  const allCompanies = await retrieveCompanies(apollo);
  const companies = getFilterdCompanies(allCompanies, rootSection);

  companies.sort((a, b) => a.name.localeCompare(b.name));
  const formatAddress = (c, appendedStyleText) => {
    const address = [];
    let streetLoc = '';
    if (c.address1) streetLoc += `<ParaStyle:DirCoAddress${appendedStyleText}>${c.address1}`;
    if (c.address2) streetLoc += `${c.address2}`;
    if (streetLoc !== '') address.push(streetLoc);
    let cityStateZip = '';
    if (c.city) cityStateZip += `<ParaStyle:DirCoAddress${appendedStyleText}>${c.city}`;
    if (c.state) cityStateZip += `, ${c.state}`;
    if (c.postalCode) cityStateZip += `, ${c.postalCode}`;
    if (c.country) cityStateZip += ` ${c.country}`;
    if (cityStateZip !== '') address.push(cityStateZip);
    return address;
  };

  const getTaxonomyIds = taxonomy => taxonomy.map(t => t.node.id);

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    const taxonomyIds = getTaxonomyIds(c.taxonomy.edges);
    let appendedStyleText = '';
    // if the Directory Export: Logo Bin is set
    if (taxonomyIds.includes(2024375)) {
      appendedStyleText = `${appendedStyleText}Logo`;
    }
    // if the Directory Export: Ad Bin is set
    if (taxonomyIds.includes(2024376)) {
      appendedStyleText = `${appendedStyleText}Ad`;
    }
    if (appendedStyleText !== '') text.push('<ParaStyle:WhiteSpaceStart>');
    if (taxonomyIds.includes(2024375) && c.primaryImage !== null) {
      text.push(`<ParaStyle:${appendedStyleText}>${c.primaryImage.source.name}`);
      const imgPath = `https://cdn.baseplatform.io/${c.primaryImage.filePath}/${c.primaryImage.source.name}`;
      if (!companyLogos.includes(imgPath)) companyLogos.push(imgPath);
    }
    text.push(`<ParaStyle:DirCoName${appendedStyleText}>${c.name}`);
    const address = formatAddress(c, appendedStyleText);
    if (address.length > 0) address.forEach(companyAddress => text.push(companyAddress));
    if (c.phone) text.push(`<ParaStyle:DirCoPhone${appendedStyleText}>PH: ${c.phone}`);
    if (c.website) text.push(`<ParaStyle:DirCoWebsite${appendedStyleText}>${c.website.replace('https://', '').replace('http://', '')}`);
    if (appendedStyleText !== '') text.push('<ParaStyle:WhiteSpaceEnd>');
    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    ...printContent(companies),
  ];


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
  return lines.join('\n');
};
