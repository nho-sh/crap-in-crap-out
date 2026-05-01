const { schemaParser } = require('./schema-parser.js');
const { isString, isArray } = require('./helpers.js');

// Regex to extract the original type keyword before schemaParser collapses
// email/hex-color/jwt/etc. down to 'string'
const originalTypeRegex =
  /^(boolean|string|integer|number|uuid|function|email|null|hex-color|jwt|timestamp-iso8601-ms|bytesize)/;

const leafToOpenAPISchema = function (schemaString) {
  // Handle the 'anything' wildcard variants
  if (
    schemaString === '...' ||
    schemaString === '...?' ||
    schemaString === '...!'
  ) {
    const result = {
      nullable: schemaString === '...?',
    };
    return result;
  }

  const parsed = schemaParser(schemaString);
  const typeMatch = originalTypeRegex.exec(schemaString);
  const originalType = typeMatch[1];

  if (originalType === 'function') {
    return null;
  }

  const result = {};

  switch (originalType) {
    case 'boolean':
      result.type = 'boolean';
      break;
    case 'string':
      result.type = 'string';
      break;
    case 'integer':
      result.type = 'integer';
      break;
    case 'number':
      result.type = 'number';
      break;
    case 'uuid':
      result.type = 'string';
      result.format = 'uuid';
      break;
    case 'email':
      result.type = 'string';
      result.format = 'email';
      result.nullable = !!parsed.optional;
      return result;
    case 'hex-color':
      result.type = 'string';
      result.pattern = '^#[A-Fa-f0-9]{6}$';
      result.nullable = !!parsed.optional;
      return result;
    case 'jwt':
      result.type = 'string';
      break;
    case 'timestamp-iso8601-ms':
      result.type = 'string';
      result.format = 'date-time';
      result.pattern = '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$';
      result.nullable = !!parsed.optional;
      return result;
    case 'bytesize':
      result.type = 'string';
      break;
    case 'null':
      result.type = 'null';
      break;
  }

  result.nullable = !!parsed.optional;

  // String length constraints and pattern
  if (result.type === 'string') {
    if (parsed.len != null) {
      result.minLength = parsed.len;
      result.maxLength = parsed.len;
    } else {
      if (parsed.gte != null) {
        result.minLength = parsed.gte;
      }
      if (parsed.gt != null) {
        result.minLength = parsed.gt + 1;
      }
      if (parsed.lte != null) {
        result.maxLength = parsed.lte;
      }
      if (parsed.lt != null) {
        result.maxLength = parsed.lt - 1;
      }
    }
    if (parsed.regex) {
      result.pattern = parsed.regex.source;
    }
  }

  // Numeric range constraints
  if (result.type === 'integer' || result.type === 'number') {
    if (parsed.gte != null) {
      result.minimum = parsed.gte;
    }
    if (parsed.gt != null) {
      result.exclusiveMinimum = parsed.gt;
    }
    if (parsed.lte != null) {
      result.maximum = parsed.lte;
    }
    if (parsed.lt != null) {
      result.exclusiveMaximum = parsed.lt;
    }
  }

  // eq => single-value enum (coerced to correct JS type)
  if (parsed.eq !== undefined) {
    let eqVal = parsed.eq;
    if (result.type === 'integer') {
      eqVal = parseInt(eqVal, 10);
    } else if (result.type === 'number') {
      eqVal = parseFloat(eqVal);
    } else if (result.type === 'boolean') {
      eqVal = eqVal === 'true';
    }
    result.enum = [eqVal];
  }

  // in => multi-value enum (coerced to correct JS type)
  if (parsed.in !== undefined) {
    const entries = parsed.in.split(',');
    if (result.type === 'integer') {
      result.enum = entries.map((v) => parseInt(v, 10));
    } else if (result.type === 'number') {
      result.enum = entries.map((v) => parseFloat(v));
    } else {
      result.enum = entries;
    }
  }

  return result;
};

const toOpenAPISchema = function (schema) {
  // isString must be checked before isArray because the helpers.js isArray
  // implementation returns truthy for strings (they have a numeric .length).
  if (isString(schema)) {
    return leafToOpenAPISchema(schema);
  }

  if (isArray(schema)) {
    if (schema.length !== 1) {
      throw new Error('Array schema must contain exactly one element schema');
    }
    return {
      type: 'array',
      items: toOpenAPISchema(schema[0]),
    };
  }

  if (schema !== null && typeof schema === 'object') {
    const properties = {};
    const required = [];

    for (let key of Object.keys(schema)) {
      const isOptionalKey = key.endsWith('?');
      const cleanKey = isOptionalKey ? key.slice(0, -1) : key;

      const propSchema = toOpenAPISchema(schema[key]);

      // Omit non-serialisable types (e.g. function) from the output
      if (propSchema !== null) {
        properties[cleanKey] = propSchema;
        if (!isOptionalKey) {
          required.push(cleanKey);
        }
      }
    }

    const result = {
      type: 'object',
      properties,
      additionalProperties: false,
    };

    if (required.length > 0) {
      result.required = required;
    }

    return result;
  }

  throw new Error(`Invalid schema value: ${schema}, cannot convert to OpenAPI`);
};

module.exports = { toOpenAPISchema };
