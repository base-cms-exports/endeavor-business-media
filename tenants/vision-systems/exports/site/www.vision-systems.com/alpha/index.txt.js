const paginateQuery = require('@endeavor-business-media/common/paginate-query');
const allPublishedContentQuery = require('./queries/content');
const { downloadImages, zipItUp, uploadToS3 } = require('./image-handler.js');

const exportName = `export-${Date.now()}.zip`;
const companyLogos = [];

const retrieveCompanies = async (apollo) => {
  const promise = await paginateQuery({
    client: apollo,
    query: allPublishedContentQuery,
    variables: { input: { includeContentTypes: 'Company', pagination: { limit: 250 }, sort: { field: 'name', order: 'asc' } } },
    cursorPath: 'input.pagination.after',
    rootValue: 'allPublishedContent',
  });

  return promise;
};


/**
 * File 1 – Categories:
 * Sort all companies assigned to category alphabetically
 * Companies sorted by sort name field which was not imported into Base in original import
 * Spacing with hidden font stylesheets were added as needed to control output,
 *   keep settings and output in InDesign
 * Not sure how ad cross-reference will work with Base
 *
 * Output:
 * <style=Catsubhead1> Father Category Name <hard return>
 * <style=Catsubhead2> Lowest Category Name <hard return>
 * <style=DirCoName> Company Name <hard return>
 * <style=DirCoAddress> Company City, Company Country; Company Website<hard return>
 *
 * If statements:
 * If no companies assigned to category, do not output category name
 * If logo assigned to company for that category only, output logo above company name <style=Logo>
 * If display ad assigned to company, output text <style=AdReference> ‘(see ad p ‘ (don’t forget
 *  extra space) <hard return>
 * If logo and display ad assigned, then output both
 * Use new style sheets for companies with ads and logos: <style=DirCoNameLogo>, <style=DirCoNameAd>
 *  , <style=DirCoNameLogoAd>, etc.
 * Entries with ads and logos should have an extra line above and below <style=WhiteSpaceStart> and
 *  <style=WhiteSpaceEnd> to designate the space as “ad space” We would then need to run a script in
 *  InDesign to measure the percentage of page space that listing occupies and calculate the ad-to
 *  -editorial ratio that is a post office requirement and can affect the cost of mailing the issue.
 *
 * Samples
 * 2019_VSD_Cats.pdf = sample PDF of complete InDesign page
 * VSD_Categories.txt = marked up/tagged texted file used for InDesign placement
 * VSD_Categories.xslt = XSLT or template file applied to XML output of data used to produce file
 *
 */
module.exports = async ({ apollo }) => {
  const companies = await retrieveCompanies(apollo);

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

  // Test Examples
  // Ad only
  // COMPANY • 16752537 • PUBLISHED • 02/06/2020, 12:00AM
  // Smart Vision Lights
  // Logo Only
  // COMPANY • 16752431 • PUBLISHED • 12/28/2015, 2:56PM
  // Xilinx, Inc.
  // Ad & Logo
  // COMPANY • 16752615 • PUBLISHED • 08/07/2018, 10:02AM
  // LUCID Vision Labs, Inc.
  // const getLogo = (c, taxonomyIds) => {
  //   const logo = [];
  //   let logoStyle = '<ParaStyle:';
  //   if (c.primaryImage !== null) {
  //     if (taxonomyIds.includes(2024375)) {
  //       logoStyle = `${logoStyle}Logo`;
  //     }
  //     if (taxonomyIds.includes(2024376)) {
  //       logoStyle = `${logoStyle}Ad`;
  //     }
  //     if (logoStyle !== '<ParaStyle:') {
  //       logo.push(`${logoStyle}>${c.primaryImage.source.name}`);
  //       // push logo path to arrary for downloading later
  //       companyLogos.push(`https://cdn.baseplatform.io/${c.primaryImage.filePath}/${c.primaryImage.source.name}`);
  //     }
  //   }
  //   return logo;
  // };

  const getTaxonomyIds = taxonomy => taxonomy.map(t => t.node.id);

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    const taxonomyIds = getTaxonomyIds(c.taxonomy.edges);
    // const logo = getLogo(c, taxonomyIds);
    // if (logo.length > 0) logo.forEach(companyLogo => text.push(companyLogo));
    let appendedStyleText = '';
    if (taxonomyIds.includes(2024375)) {
      appendedStyleText = `${appendedStyleText}Logo`;
    }
    if (taxonomyIds.includes(2024376)) {
      appendedStyleText = `${appendedStyleText}Ad`;
    }
    if (appendedStyleText !== '') text.push('<ParaStyle:WhiteSpaceStart>');
    if (taxonomyIds.includes(2024375) && c.primaryImage !== null) text.push(`<ParaStyle:${appendedStyleText}>${c.primaryImage.source.name}`);
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

  const tmpDir = `${__dirname}/tmp`;

  // Tempararly download all logs for zipping up.
  await downloadImages(`${tmpDir}/images`, companyLogos.slice(0, 200));
  // Zip up all logos required for export
  zipItUp(`${tmpDir}/images`, tmpDir, exportName);
  // push a tmp zip file of image to the S3 server
  uploadToS3('base-cms-exports', 'exports', `${tmpDir}/${exportName}`);

  lines.push(`<ParaStyel:LogoDownloadPath>https://base-cms-exports.s3.amazonaws.com/exports/${exportName}`);

  // @todo port special character filter from php
  return lines.join('\n');
};
