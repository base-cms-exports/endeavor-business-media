const { getAsArray, getAsObject } = require('@base-cms/object-path');
const { isValid, getName, getAlpha2Code } = require('i18n-iso-countries');
const usRegions = require('../utils/us-regions');
const websiteSectionsQuery = require('./queries/sections');
const allPublishedContentQuery = require('./queries/content');
const { retrieveRootSection } = require('../utils/retrieve-root-section');
const { retrieveCompanies } = require('../utils/retrieve-companies');
const { retrieveFilterdCompanies } = require('../utils/retrieve-filtered-companies');

const countryCodes = {
  'Cote D Ivoire': 'CI',
  'Federated States of Micronesia': 'FM',
  'Guinea Bissau': 'GW',
  'Holy See (Vatican City)': 'VA',
  Iran: 'IR',
  Laos: 'LA',
  Macau: 'MO',
  Macedonia: 'MK',
  Moldova: 'MD',
  Palestine: 'PS',
  'South Georgia': 'GS',
  'St. Lucia': 'LC',
  'St. Pierre and Miquelon': 'PM',
  Tanzania: 'TZ',
  'The Gambia': 'GM',
  'United States': 'US',
  'Ascension Island': 'SH',
  Korea: 'KR',
  Zaire: 'CD',
  'Netherlands Antilles': 'SX',
  'Virgin Islands': 'VI',
  'Western Samoa': 'WS',
  Yugoslavia: 'RS',
};

const setCountryName = (value) => {
  if (!value) return value;
  if (!isValid(value)) {
    const code = getAlpha2Code(value, 'en');
    if (code) return getName(code, 'en');
  } else {
    return getName(value, 'en');
  }
  return value;
};

const compareNames = (a, b) => `${a.name}`.localeCompare(`${b.name}`);
const compareRegion = (a, b) => {
  if (a.country === 'United States of America') {
    const result = `${a.state}`.localeCompare(b.state);
    if (result === 0) return compareNames(a, b);
    return result;
  }
  return compareNames(a, b);
};

const compare = (a, b) => {
  const countryA = a.country;
  const countryB = b.country;
  const result = `${countryA}`.localeCompare(countryB);
  if (result === 0) return compareRegion(a, b);
  return result;
};

module.exports = async ({ apollo }) => {
  const rootSection = await retrieveRootSection(apollo, websiteSectionsQuery, 'directory');
  const allCompanies = await retrieveCompanies(apollo, allPublishedContentQuery);
  const directoryCompanies = retrieveFilterdCompanies(allCompanies, rootSection);
  const getTaxonomyIds = taxonomy => taxonomy.map(t => t.node.id);
  const filteredCompanies = directoryCompanies.reduce((arr, company) => {
    if (getTaxonomyIds(getAsArray(company, 'taxonomy.edges')).includes(2023082)) {
      return [
        ...arr,
        company,
      ];
    }
    return [
      ...arr,
    ];
  }, []);

  const companies = filteredCompanies
    .map((orgCompany) => {
      const country = countryCodes[orgCompany.country] || orgCompany.country;
      let state = getAsObject(usRegions, orgCompany.state);
      state = state.name || orgCompany.state;
      return {
        ...orgCompany,
        country: setCountryName(country),
        state,
      };
    })
    .filter(company => company.country);

  const dataObject = companies.sort(compare).reduce((obj, company) => {
    const { country } = company;
    const { state } = company;
    const countryObj = obj[country] || { name: country };

    if (country === 'United States of America') {
      const stateObj = getAsObject(countryObj, `states.${state}`);
      countryObj.states = {
        ...getAsObject(countryObj, 'states'),
        [state]: {
          ...stateObj,
          name: state,
          companies: [
            ...getAsArray(stateObj, 'companies'),
            company,
          ],
        },
      };
    } else {
      countryObj.companies = [
        ...getAsArray(countryObj, 'companies'),
        company,
      ];
    }
    return {
      ...obj,
      [country]: {
        ...countryObj,
      },
    };
  }, {});

  const sorted = Object.keys(dataObject).map((key) => {
    if (key === 'United States of America') {
      const country = dataObject[key];
      const states = Object.keys(country.states).map(k => country.states[k]);
      return { ...country, states };
      // return dataObject[key];
    }
    return dataObject[key];
  });

  // Wrap content in paragraph style
  const printContent = arr => arr.map((c) => {
    const text = [];
    text.push(`<ParaStyle:CountrySubHead>${c.name}`);
    if (c.companies) {
      c.companies.forEach((comp) => {
        text.push(`<ParaStyle:CountryCoName>${comp.name}`);
      });
    }
    if (c.name === 'United States of America') {
      c.states.forEach((state) => {
        text.push(`<ParaStyle:StateSubhead>${state.name}`);
        if (state.companies) {
          state.companies.forEach((comp) => {
            text.push(`<ParaStyle:CountryCoName>${comp.name}`);
          });
        }
      });
    }
    return text.join('\n');
  });

  const lines = [
    '<ASCII-MAC>', // @todo detect and/or make query a param
    ...printContent(sorted),
  ];

  // @todo port special character filter from php
  return lines.join('\n');
};
