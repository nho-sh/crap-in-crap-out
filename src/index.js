const querystring = require('querystring');

const { isString, isFunction, isInteger, isFloat, isArray, isDefined } = require('./helpers');

const { notAFunction, notAGoodSchema, schemaDuplicateValues, badSchemaNumber } = require('./errors');

const parseRegex = /^(boolean|string|integer|number|uuid|function|email|hex-color|jwt|password|timestamp-iso8601-ms|bytesize)([!?]|$)(.*)/;

const schemaParser = function(schema) {
  var append, eq, getNum, gt, gte, ins, len, lt, lte, match, optional, prepend, query, regex, result, type;
  if (!isString(schema)) {
    throw new Error(notAGoodSchema);
  }
  if (schema[0] === '.' && (schema === '...' || schema === '...?' || schema === '...!')) {
    return {
      source: schema,
      type: 'anything',
      optional: schema.indexOf('?') === 3
    };
  }
  match = parseRegex.exec(schema);
  if (!match) {
    throw new Error(`Failed to parse schema ${schema}`);
  }
  type = match[1];
  optional = match[2] === '?';
  query = querystring.parse(match[3]);
  
  // Check if any key in the schema is defined double: gte=1&gte=0
  Object.values(query).forEach(function(val) {
    if (!isString(val)) {
      throw new Error(schemaDuplicateValues(schema, val));
    }
  });
  getNum = function(str) {
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
  gte = getNum(query.gte);
  gt = getNum(query.gt);
  len = getNum(query.len);
  lte = getNum(query.lte);
  lt = getNum(query.lt);
  eq = query.eq;
  ins = query.in;
  regex = !query.regex ? null : (result = query.regex.trim(), result[0] !== '^' ? prepend = '^' : void 0, result[result.length - 1] !== '$' ? append = '$' : void 0, new RegExp((prepend || '') + result + (append || '')));
  if (type === 'boolean') {
    return {
      source: schema,
      type: 'boolean',
      optional,
      eq
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
      regex
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
      in: ins
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
      in: ins
    };
  } else if (type === 'function') {
    return {
      source: schema,
      type: 'function',
      optional
    };
  } else if (type === 'uuid') {
    return {
      // TODO: can extend with v1 v4, etc
      source: schema,
      type: 'uuid',
      optional
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
      regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    };
  } else if (type === 'jwt') {
    return {
      source: schema,
      type: 'string',
      optional,
      regex: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
    };
  } else if (type === 'hex-color') {
    return {
      source: schema,
      type: 'string',
      optional,
      regex: /^#[A-Fa-f0-9]{6}$/
    };
  } else if (type === 'password') {
    return {
      source: schema,
      type: 'string',
      optional,
      gte: 8
    };
  } else if (type === 'timestamp-iso8601-ms') {
    return {
      source: schema,
      type: 'string',
      optional,
      len: 24,
      regex: /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.[0-9]{3}Z$/
    };
  } else if (type === 'bytesize') {
    return {
      source: schema,
      type: 'string',
      optional,
      regex: new RegExp([
        "^",
        // A positive number 000.123...
        "[0-9]+(\\.[0-9]+)?(",
        // Allow optional spacing
        "\\s*(",
        // Base unit
        "B",
        // Decimal based namings
        "|kB|kilobyte|MB|megabyte|GB|gigabyte|TB|terabyte|PB|petabyte|EB|exabyte|ZB|zettabyte|YB|yottabyte",
        // Binary based namings
        "|KiB|kibibyte|MiB|mebibyte|GiB|gibibyte|TiB|tebibyte|PiB|pebibyte|EiB|exbibyte|ZiB|zebibyte|YiB|yobibyte",
        // Unit is optional -> Just bytes?
        "))?",
        "$"
      ].join(''))
    };
  }
};

const anythingValidator = function(parsedSchema) {
  return function(good) {
    if (good === null || good === void 0) {
      if (parsedSchema.optional) {
        return false;
      }
      return `${good} was supplied, but not allowed`;
    }
    
    // Allow anything
    return false;
  };
};

const booleanValidator = function(parsedSchema) {
  return function(good) {
    if (good === null) {
      if (parsedSchema.optional) {
        return false;
      }
      return "null was supplied, but not allowed";
    }
    if (isDefined(parsedSchema.eq) && good !== parsedSchema.eq) {
      return `Not the expected value ${parsedSchema.eq}`;
    }
    if (good === true || good === false) {
      return false;
    }
    return `Not a boolean: ${good}`;
  };
};

const stringValidator = function(parsedSchema) {
  return function(good) {
    var len, realLen;
    if (good === null) {
      if (parsedSchema.optional) {
        return false;
      }
      return "null was supplied, but not allowed";
    }
    if (isString(good)) {
      if (isDefined(parsedSchema.eq) && good !== parsedSchema.eq) {
        return `Not the expected value ${parsedSchema.eq}`;
      }
      if (isDefined(parsedSchema.len)) {
        realLen = good.length;
        if (realLen !== parsedSchema.len) {
          return `Expecting value length ${parsedSchema.len} but got ${realLen}`;
        }
      }
      if (parsedSchema.in && parsedSchema.in.indexOf(good) < 0) {
        return `Value ${good} not in the allowed list ${parsedSchema.in.join(',')}`;
      }
      if (parsedSchema.regex && !parsedSchema.regex.test(good)) {
        return `Value ${good} does not match the regular expression ${parsedSchema.regex.toString()}`;
      }
      len = good.length;
      if (parsedSchema.gte && len < parsedSchema.gte) {
        return `${len} <= ${parsedSchema.gte} evaluated false`;
      }
      if (parsedSchema.gt && len <= parsedSchema.gt) {
        return `${len} < ${parsedSchema.gt} evaluated false`;
      }
      if (parsedSchema.lte && len > parsedSchema.lte) {
        return `${len} >= ${parsedSchema.lte} evaluated false`;
      }
      if (parsedSchema.lt && len >= parsedSchema.lt) {
        return `${len} > ${parsedSchema.lt} evaluated false`;
      }
      return false;
    }
    return `Not a string: ${good}`;
  };
};

const integerValidator = function(parsedSchema) {
  return function(good) {
    if (good === null) {
      if (parsedSchema.optional) {
        return false;
      }
      return "null was supplied, but not allowed";
    }
    if (isInteger(good)) {
      if (isDefined(parsedSchema.eq) && good !== parsedSchema.eq) {
        return `Not the expected value ${parsedSchema.eq}`;
      }
      if (parsedSchema.in && parsedSchema.in.indexOf(good) < 0) {
        return `Value ${good} not in the allowed list ${parsedSchema.in.join(',')}`;
      }
      if (parsedSchema.gte && good < parsedSchema.gte) {
        return `${good} <= ${parsedSchema.gte} evaluated false`;
      }
      if (parsedSchema.gt && good <= parsedSchema.gt) {
        return `${good} < ${parsedSchema.gt} evaluated false`;
      }
      if (parsedSchema.lte && good > parsedSchema.lte) {
        return `${good} >= ${parsedSchema.lte} evaluated false`;
      }
      if (parsedSchema.lt && good >= parsedSchema.lt) {
        return `${good} > ${parsedSchema.lt} evaluated false`;
      }
      return false;
    }
    return `Not an integer: ${good}`;
  };
};

const numberValidator = function(parsedSchema) {
  return function(good) {
    if (good === null) {
      if (parsedSchema.optional) {
        return false;
      }
      return "null was supplied, but not allowed";
    }
    if (isFloat(good)) {
      if (isDefined(parsedSchema.eq) && good !== parsedSchema.eq) {
        return `Not the expected value ${parsedSchema.eq}`;
      }
      if (parsedSchema.in && parsedSchema.in.indexOf(good) < 0) {
        return `Value ${good} not in the allowed list ${parsedSchema.in.join(',')}`;
      }
      if (parsedSchema.gte && good < parsedSchema.gte) {
        return `${good} <= ${parsedSchema.gte} evaluated false`;
      }
      if (parsedSchema.gt && good <= parsedSchema.gt) {
        return `${good} < ${parsedSchema.gt} evaluated false`;
      }
      if (parsedSchema.lte && good > parsedSchema.lte) {
        return `${good} >= ${parsedSchema.lte} evaluated false`;
      }
      if (parsedSchema.lt && good >= parsedSchema.lt) {
        return `${good} > ${parsedSchema.lt} evaluated false`;
      }
      return false;
    }
    return `${good} is not a numbering number`;
  };
};

const shortUuidRegex = /^[a-fA-F0-9]{32}$/;

const longUuidRegex = /^[a-fA-F0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/;

const uuidValidator = function(parsedSchema) {
  return function(good) {
    var len;
    if (good === null) {
      if (parsedSchema.optional) {
        return false;
      }
      return "null was supplied, but not allowed";
    }
    if (isString(good)) {
      len = good.length;
      if (len === 32 && shortUuidRegex.test(good)) {
        return false;
      } else if (len === 36 && longUuidRegex.test(good)) {
        return false;
      }
    }
    return `Not a uuid: ${good}`;
  };
};

const functionValidator = function(parsedSchema) {
  return function(good) {
    if (good === null) {
      if (parsedSchema.optional) {
        return false;
      }
      return "null was supplied, but function expected";
    }
    if (isFunction(good)) {
      return false;
    }
    return `Not a function: ${typeof good}`;
  };
};

const knownValueCheckers = {};

const valueChecker = function(schema) {
  var newValidator, parsedSchema, val, validator;
  validator = knownValueCheckers[schema];
  if (validator) {
    
    // Cached?
    return validator;
  }
  
  // Does not exist, create it
  parsedSchema = schemaParser(schema);
  newValidator = (function() {
    switch (parsedSchema.type) {
      case 'anything':
        return anythingValidator(parsedSchema);
      case 'boolean':
        if (isDefined(parsedSchema.eq)) {
          parsedSchema.eq = (function() {
            switch (parsedSchema.eq) {
              case 'true':
                return true;
              case 'false':
                return false;
              default:
                throw new Error(`${parsedSchema.source} has to be eq=true or eq=false`);
            }
          })();
        }
        return booleanValidator(parsedSchema);
      case 'string':
        if (isDefined(parsedSchema.in)) {
          parsedSchema.in = parsedSchema.in.split(',');
        }
        return stringValidator(parsedSchema);
      case 'integer':
        if (isDefined(parsedSchema.eq)) {
          val = parseInt(parsedSchema.eq, 10);
          if (isNaN(val)) {
            throw new Error(`${parsedSchema.source} is not an integer: eq=${parsedSchema.eq}`);
          }
          parsedSchema.eq = val;
        }
        if (isDefined(parsedSchema.in)) {
          parsedSchema.in = parsedSchema.in.split(',').map(function(int) {
            val = parseInt(int, 10);
            if (isNaN(val)) {
              throw new Error(`${parsedSchema.source} is not a integer: in=${parsedSchema.in}`);
            }
            return val;
          });
        }
        return integerValidator(parsedSchema);
      case 'number':
        if (isDefined(parsedSchema.eq)) {
          val = parseFloat(parsedSchema.eq);
          if (isNaN(val)) {
            throw new Error(`${parsedSchema.source} is not a number: eq=${parsedSchema.eq}`);
          }
          parsedSchema.eq = val;
        }
        if (isDefined(parsedSchema.in)) {
          parsedSchema.in = parsedSchema.in.split(',').map(function(fl) {
            val = parseFloat(fl);
            if (isNaN(val)) {
              throw new Error(`${parsedSchema.source} is not a number: in=${parsedSchema.in}`);
            }
            return val;
          });
        }
        return numberValidator(parsedSchema);
      case 'function':
        return functionValidator(parsedSchema);
      case 'uuid':
        return uuidValidator(parsedSchema);
    }
  })();
  
  // Cache forever
  knownValueCheckers[schema] = newValidator;
  return newValidator;
};

const inspectForError = function(schema, good) {
  var validator;
  validator = valueChecker(schema);
  return validator(good);
};

const guard = function(schema, goods, parentGoods) {
  var err, good, goodsCount, guarded, hasError, i, idx, j, k, key, keyLen, l, len1, len2, nil, objSchema, optional, ref, ref1, result, schemaCount, val;
  if (isString(schema)) {
    hasError = inspectForError(schema, goods);
    if (hasError) {
      throw `:${schema} ` + hasError;
    } else {
      // Schema is validated at this point
      // so it can be schema=function OR schema=... + typeof(goods)=function
      if (schema === 'function' || isFunction(goods)) {
        // Since we construct our own object/array with fields,
        // the functions we assign into our structure will have a different scope
        // Therefor, when we copy over functions by reference, we need to correct their scope
        return goods.bind(parentGoods);
      }
      return goods || null;
    }
  }
  if (isArray(schema)) {
    if (!isArray(goods)) {
      throw ":Value is not an array";
    }
    result = [];
    schemaCount = schema.length;
    if (schemaCount === 0) {
      throw " No schema(s) defined in the array";
    }
    if (schemaCount === 1) {
      // Typical scenario, just go through it as fast as possible
      schema = schema[0];
      for (idx = j = 0, len1 = goods.length; j < len1; idx = ++j) {
        good = goods[idx];
        try {
          guarded = guard(schema, good, goods);
        } catch (error) {
          err = error;
          throw `[${idx}]${err.message || err}`;
        }
        result.push(guarded);
      }
    } else {
      goodsCount = goods.length;
      
      // Abort when the number of goods are not a multiple of the schema count
      if ((goodsCount % schemaCount) !== 0) {
        throw ` Values array length (${goodsCount}) is not a multiple of the schema arraylength (${schemaCount})`;
      }
      ref = schemaCount;
      for ((ref > 0 ? (idx = k = 0, len2 = goods.length) : idx = k = goods.length - 1); ref > 0 ? k < len2 : k >= 0; idx = k += ref) {
        good = goods[idx];
        for (i = l = 0, ref1 = schemaCount - 1; (0 <= ref1 ? l <= ref1 : l >= ref1); i = 0 <= ref1 ? ++l : --l) {
          good = goods[idx + i];
          try {
            guarded = guard(schema[i], good, goods);
          } catch (error) {
            err = error;
            throw `[${idx + i}]${err.message || err}`;
          }
          result.push(guarded);
        }
      }
    }
    return result;
  } else {
    if (!goods) {
      throw ":Value is not an object";
    }
    
    // Also handled bad input
    // luckily the for-of construct ignores values such as:
    // undefined/null/numbers/etc
    result = {};
    for (key in schema) {
      if (!Object.hasOwnProperty.call(schema, key)) continue;
      objSchema = schema[key];
      try {
        keyLen = key.length;
        optional = key[keyLen - 1] === '?';
        if (optional) {
          key = key.substr(0, keyLen - 1);
        }
        val = goods[key];
        nil = val === null || val === void 0;
        if (nil && optional) {
          guarded = null;
        } else {
          guarded = guard(objSchema, val, goods);
        }
      } catch (error) {
        err = error;
        throw `.${key}${err}`;
      }
      result[key] = guarded;
    }
    return result;
  }
};

const guardian = function(input_schema, out_schema) {
  if (arguments.length > 2) {
    throw new Error(`Guardian only excepts input_schema and out_schema, no further arguments. You supplied ${arguments.length}`);
  }
  if (!input_schema && !out_schema) {
    throw new Error("Guardian got no schema's to validate with, pass either input or out schema, or both.");
  }
  if (input_schema && !isArray(input_schema)) {
    throw new Error("Guardian input schema always needs to be an array of schemas, one for each input argument. It can also be null or undefined.");
  }
  return function(funcToWrap) {
    if (!isFunction(funcToWrap)) {
      throw new Error(notAFunction);
    }
    return function() {
      var args, err, result, scope;
      scope = this;
      args = arguments;
      if (input_schema) {
        try {
          result = funcToWrap.apply(scope, guard(input_schema, args));
        } catch (error) {
          err = error;
          throw `Guarding input failed ${err.message || err}`;
        }
      } else {
        result = funcToWrap.apply(scope, args);
      }
      if (out_schema) {
        return guard(out_schema, result);
      }
      return result;
    };
  };
};

module.exports = {
  inspectForError: inspectForError,
  reject: function(schema, goods) {
    var hasError;
    hasError = inspectForError(schema, goods);
    if (hasError) {
      throw new Error(hasError);
    }
  },
  guard: function(schemas, goods) {
    var err, finalError;
    try {
      return guard(schemas, goods);
    } catch (error) {
      err = error;
      finalError = err;
      if (finalError[0] === '.') {
        finalError = finalError.substr(1);
      }
      throw new Error(`Guard failed: ${finalError}`);
    }
  },
  guardian: guardian
};
