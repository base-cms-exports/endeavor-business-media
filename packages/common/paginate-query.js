const { getAsArray, getAsObject } = require('@base-cms/object-path');

// @todo clean this up
const buildVars = (variables, cursorPath, endCursor) => {
  const keys = cursorPath.split('.');
  if (keys.length === 0) {
    return { ...variables, endCursor };
  }
  if (keys.length === 1) {
    return { ...variables, [keys[0]]: endCursor };
  }
  if (keys.length === 2) {
    const k1 = keys[0];
    const k2 = keys[1];
    return {
      ...variables,
      [k1]: {
        ...variables[k1],
        [k2]: endCursor,
      },
    };
  }
  if (keys.length === 3) {
    const k1 = keys[0];
    const k2 = keys[1];
    const k3 = keys[2];
    return {
      ...variables,
      [k1]: {
        ...variables[k1],
        [k2]: {
          ...variables[k1][k2],
          [k3]: endCursor,
        },
      },
    };
  }
  throw new Error(`Unable to parse cursorPath ${cursorPath}`);
};

/**
 * Returns all results from the specified query
 * @param results     - The results to accumulate
 * @param client      - The GraphQL client
 * @param query       - The GraphQL query
 * @param variables   - The GraphQL query variables
 * @param cursorPath  - The dot-notated path within `variables` that the cursor should be placed
 * @param rootValue   - The root query key, e.g; `data.queryName`
 */
const executor = async (args) => {
  const {
    results = [],
    client,
    query,
    variables,
    cursorPath,
    rootValue,
  } = args;
  const r = await client.query({ query, variables }, rootValue);
  const items = getAsArray(r, `data.${rootValue}.edges`).map(({ node }) => node);
  const pageInfo = getAsObject(r, `data.${rootValue}.pageInfo`);
  if (pageInfo.hasNextPage) {
    const { endCursor } = pageInfo;
    const vars = buildVars(variables, cursorPath, endCursor);
    return executor({
      ...args,
      variables: vars,
      results: [...results, ...items],
    });
  }
  return [...results, ...items];
};

module.exports = executor;
