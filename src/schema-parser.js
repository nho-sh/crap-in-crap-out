const {
  notAGoodSchema,
  schemaDuplicateValues,
  badSchemaNumber,
} = require('./errors.js');

const { isString } = require('./helpers.js');

const querystring = require('querystring');

const parseRegex =
  /^(boolean|string|integer|number|uuid|function|email|null|hex-color|jwt|password|timestamp-iso8601-ms|bytesize)([!?]|$)(.*)/;

const schemaParser = function (schema) {
  var append, prepend, regex, result;
  if (!isString(schema)) {
    throw new Error(notAGoodSchema);
  }
  if (
    schema[0] === '.' &&
    (schema === '...' || schema === '...?' || schema === '...!')
  ) {
    return {
      source: schema,
      type: 'anything',
      optional: schema.indexOf('?') === 3,
    };
  }
  const match = parseRegex.exec(schema);
  if (!match) {
    throw new Error(`Failed to parse schema ${schema}`);
  }
  const type = match[1];
  const optional = match[2] === '?';
  const query = querystring.parse(match[3]);

  // Check if any key in the schema is defined double: gte=1&gte=0
  Object.values(query).forEach(function (val) {
    if (!isString(val)) {
      throw new Error(schemaDuplicateValues(schema, val));
    }
  });
  const getNum = function (str) {
    var number;
    if (str === void 0) {
      return null;
    }
    number = parseFloat(str);
    if (isNaN(number)) {
      throw new Error(badSchemaNumber(schema, str));
    }
    return number;
  };

  // Parse out some numbers and check if they make sense
  const gte = getNum(query.gte);
  const gt = getNum(query.gt);
  const len = getNum(query.len);
  const lte = getNum(query.lte);
  const lt = getNum(query.lt);
  const eq = query.eq;
  const ins = query.in;

  regex = !query.regex
    ? null
    : ((result = query.regex.trim()),
      result[0] !== '^' ? (prepend = '^') : void 0,
      result[result.length - 1] !== '$' ? (append = '$') : void 0,
      new RegExp((prepend || '') + result + (append || '')));

  // istanbul ignore else
  if (type === 'boolean') {
    return {
      source: schema,
      type: 'boolean',
      optional,
      eq,
    };
  } else if (type === 'string') {
    return {
      source: schema,
      type: 'string',
      optional,
      gte,
      lte,
      len,
      gt,
      lt,
      eq,
      in: ins,
      regex,
    };
  } else if (type === 'integer') {
    return {
      source: schema,
      type: 'integer',
      optional,
      gte,
      lte,
      gt,
      lt,
      eq,
      in: ins,
    };
  } else if (type === 'number') {
    return {
      source: schema,
      type: 'number',
      optional,
      gte,
      lte,
      gt,
      lt,
      eq,
      in: ins,
    };
  } else if (type === 'function') {
    return {
      source: schema,
      type: 'function',
      optional,
    };
  } else if (type === 'uuid') {
    return {
      // TODO: can extend with v1 v4, etc
      source: schema,
      type: 'uuid',
      optional,
    };

    // Special types
  } else if (type === 'email') {
    return {
      source: schema,
      type: 'string',
      optional,
      gte,
      lte,
      gt,
      lt,
      eq,
      in: ins,
      regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    };
  } else if (type === 'null') {
    return {
      source: schema,
      type: 'null',
      optional: false,
    };
  } else if (type === 'jwt') {
    return {
      source: schema,
      type: 'string',
      optional,
      regex: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
    };
  } else if (type === 'hex-color') {
    return {
      source: schema,
      type: 'string',
      optional,
      regex: /^#[A-Fa-f0-9]{6}$/,
    };
  } else if (type === 'password') {
    return {
      source: schema,
      type: 'string',
      optional,
      gte: 8,
    };
  } else if (type === 'timestamp-iso8601-ms') {
    return {
      source: schema,
      type: 'string',
      optional,
      len: 24,
      regex: /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.[0-9]{3}Z$/,
    };
  } else if (type === 'bytesize') {
    return {
      source: schema,
      type: 'string',
      optional,
      regex: new RegExp(
        [
          '^',
          // A positive number 000.123...
          '[0-9]+(\\.[0-9]+)?(',
          // Allow optional spacing
          '\\s*(',
          // Base unit
          'B',
          // Decimal based namings
          '|kB|kilobyte|MB|megabyte|GB|gigabyte|TB|terabyte|PB|petabyte|EB|exabyte|ZB|zettabyte|YB|yottabyte',
          // Binary based namings
          '|KiB|kibibyte|MiB|mebibyte|GiB|gibibyte|TiB|tebibyte|PiB|pebibyte|EiB|exbibyte|ZiB|zebibyte|YiB|yobibyte',
          // Unit is optional -> Just bytes?
          '))?',
          '$',
        ].join('')
      ),
    };
  } else {
    // NOTE: Regex above prevents getting to this point
    // But its here in case its overlooked in dev
    throw `Unknown type in schema ${type}, adjust 'parseRegex'`;
  }
};

module.exports = {
  schemaParser: schemaParser,
};
