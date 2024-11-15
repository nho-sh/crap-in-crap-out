const { isString, isFunction, isArray, isDefined } = require('./helpers.js');

const { notAFunction } = require('./errors.js');

const { schemaParser } = require('./schema-parser.js');

const {
  anythingValidator,
  booleanValidator,
  functionValidator,
  integerValidator,
  nullValidator,
  numberValidator,
  stringValidator,
  uuidValidator,
} = require('./validators.js');

const knownValueCheckers = {};

const valueChecker = function (schema) {
  const validator = knownValueCheckers[schema];
  if (validator) {
    // Cached?
    return validator;
  }

  // Does not exist, create it
  const parsedSchema = schemaParser(schema);
  const newValidator = (function () {
    switch (parsedSchema.type) {
      case 'anything':
        return anythingValidator(parsedSchema);
      case 'boolean':
        if (isDefined(parsedSchema.eq)) {
          parsedSchema.eq = (function () {
            switch (parsedSchema.eq) {
              case 'true':
                return true;
              case 'false':
                return false;
              default:
                throw new Error(
                  `${parsedSchema.source} has to be eq=true or eq=false`
                );
            }
          })();
        }
        return booleanValidator(parsedSchema);
      case 'string':
        if (isDefined(parsedSchema.in)) {
          parsedSchema.in = parsedSchema.in.split(',');
        }
        return stringValidator(parsedSchema);
      case 'integer': {
        if (isDefined(parsedSchema.eq)) {
          const val = parseInt(parsedSchema.eq, 10);
          if (isNaN(val)) {
            throw new Error(
              `${parsedSchema.source} is not an integer: eq=${parsedSchema.eq}`
            );
          }
          parsedSchema.eq = val;
        }
        if (isDefined(parsedSchema.in)) {
          parsedSchema.in = parsedSchema.in.split(',').map(function (int) {
            const val = parseInt(int, 10);
            if (isNaN(val)) {
              throw new Error(
                `${parsedSchema.source} is not a integer: in=${parsedSchema.in}`
              );
            }
            return val;
          });
        }
        return integerValidator(parsedSchema);
      }
      case 'number': {
        if (isDefined(parsedSchema.eq)) {
          const val = parseFloat(parsedSchema.eq);
          if (isNaN(val)) {
            throw new Error(
              `${parsedSchema.source} is not a number: eq=${parsedSchema.eq}`
            );
          }
          parsedSchema.eq = val;
        }
        if (isDefined(parsedSchema.in)) {
          parsedSchema.in = parsedSchema.in.split(',').map(function (fl) {
            const val = parseFloat(fl);
            if (isNaN(val)) {
              throw new Error(
                `${parsedSchema.source} is not a number: in=${parsedSchema.in}`
              );
            }
            return val;
          });
        }
        return numberValidator(parsedSchema);
      }
      case 'function':
        return functionValidator(parsedSchema);
      case 'uuid':
        return uuidValidator(parsedSchema);
      case 'null': {
        return nullValidator(parsedSchema);
      }
    }
  })();

  // Cache forever
  knownValueCheckers[schema] = newValidator;
  return newValidator;
};

const inspectForError = function (schema, good) {
  const validator = valueChecker(schema);
  return validator(good);
};

const guard = function (schema, goods) {
  if (isString(schema)) {
    const hasError = inspectForError(schema, goods);
    if (hasError) {
      throw `:${schema} ` + hasError;
    } else {
      // Schema is validated at this point
      // Om case goods is undefined, we fallback to null
      return goods != null ? goods : null;
    }
  }
  if (isArray(schema)) {
    if (!isArray(goods)) {
      throw `:Value is not an array, but a ${typeof goods}`;
    }
    const result = [];
    const schemaCount = schema.length;
    if (schemaCount === 0) {
      throw ' No schema(s) defined in the array';
    }
    if (schemaCount === 1) {
      // Typical scenario, just go through it as fast as possible
      schema = schema[0];
      const goodsLength = goods.length;
      for (let idx = 0; idx < goodsLength; idx++) {
        const good = goods[idx];
        try {
          const guarded = guard(schema, good);
          result.push(guarded);
        } catch (error) {
          throw `[${idx}]${error.message || error}`;
        }
      }
    } else {
      throw ' More than 1 schema in the array';
    }

    return result;
  } else {
    if (!goods) {
      throw ':Value is not an object';
    }

    // Also handled bad input
    // luckily the for-of construct ignores values such as:
    // undefined/null/numbers/etc
    const result = {};
    for (let key of Object.keys(schema)) {
      const objSchema = schema[key];
      let guarded = null;

      try {
        const keyLen = key.length;
        // Check if the object key ends with a '?'
        // thus making it optional instead of required
        const optional = key[keyLen - 1] === '?';

        if (optional) {
          key = key.substring(0, keyLen - 1);
        }
        const val = goods[key];
        if (val == null && optional) {
          guarded = null;
        } else {
          guarded = guard(objSchema, val, goods);
        }
      } catch (error) {
        throw `.${key}${error}`;
      }
      result[key] = guarded;
    }
    return result;
  }
};

const guardian = function (input_schema, out_schema) {
  if (arguments.length > 2) {
    throw new Error(
      `Guardian only excepts input_schema and out_schema, no further arguments. You supplied ${arguments.length}`
    );
  }
  if (!input_schema && !out_schema) {
    throw new Error(
      "Guardian got no schema's to validate with, pass either input or out schema, or both."
    );
  }
  if (input_schema && !isArray(input_schema)) {
    throw new Error(
      'Guardian input schema always needs to be an array of schemas, one for each input argument. It can also be null or undefined.'
    );
  }
  return function (funcToWrap) {
    if (!isFunction(funcToWrap)) {
      throw new Error(notAFunction);
    }
    return function () {
      const args = arguments;
      const scope = this;
      let result;
      if (input_schema) {
        try {
          result = funcToWrap.apply(scope, guard(input_schema, args));
        } catch (error) {
          throw `Guarding input failed ${error.message || error}`;
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
  reject: function (schema, goods) {
    const hasError = inspectForError(schema, goods);
    if (hasError) {
      throw new Error(hasError);
    }
  },
  guard: function (schemas, goods) {
    try {
      return guard(schemas, goods);
    } catch (error) {
      let finalError = error;
      if (finalError[0] === '.') {
        finalError = finalError.substring(1);
      }
      throw new Error(`Guard failed: ${finalError}`);
    }
  },
  guardian: guardian,
};
