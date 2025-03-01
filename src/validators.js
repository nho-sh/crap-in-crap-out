const { isString, isFunction, isFloat, isDefined } = require('./helpers.js');

// Validator logic:
//   Return false if okay
//   Return error string if not okay,
//     describing the problem

const anythingValidator = function (parsedSchema) {
  return function (good) {
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

const booleanValidator = function (parsedSchema) {
  return (good) => {
    if (good === null) {
      if (parsedSchema.optional) {
        return false;
      }
      return 'null was supplied, but not allowed';
    }
    if (isDefined(parsedSchema.eq) && good !== parsedSchema.eq) {
      return `${good} is not the expected value ${parsedSchema.eq}`;
    }
    if (good === true || good === false) {
      return false;
    }
    return `${good} is not a boolean`;
  };
};

const stringValidator = function (parsedSchema) {
  return (good) => {
    if (good === null) {
      if (parsedSchema.optional) {
        return false;
      }
      return 'null was supplied, but not allowed';
    }
    if (isString(good)) {
      if (isDefined(parsedSchema.eq) && good !== parsedSchema.eq) {
        return `${good} is not the expected value ${parsedSchema.eq}`;
      }
      if (isDefined(parsedSchema.len)) {
        const realLen = good.length;
        if (realLen !== parsedSchema.len) {
          return `Expecting value length ${parsedSchema.len} but got ${realLen}`;
        }
      }
      if (parsedSchema.in && parsedSchema.in.indexOf(good) < 0) {
        return `${good} not in the allowed list ${parsedSchema.in.join(',')}`;
      }
      if (parsedSchema.regex && !parsedSchema.regex.test(good)) {
        return `${good} does not match the regular expression ${parsedSchema.regex.toString()}`;
      }
      const len = good.length;
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
    return `${good} is not a string`;
  };
};

const integerValidator = function (parsedSchema) {
  return (good) => {
    if (good === null) {
      if (parsedSchema.optional) {
        return false;
      }
      return 'null was supplied, but not allowed';
    }
    if (Number.isInteger(good)) {
      if (isDefined(parsedSchema.eq) && good !== parsedSchema.eq) {
        return `Not the expected value ${parsedSchema.eq}`;
      }
      if (parsedSchema.in && parsedSchema.in.indexOf(good) < 0) {
        return `${good} not in the allowed list ${parsedSchema.in.join(',')}`;
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
    return `${good} is not an integer`;
  };
};

const numberValidator = function (parsedSchema) {
  return (good) => {
    if (good === null) {
      if (parsedSchema.optional) {
        return false;
      }
      return 'null was supplied, but not allowed';
    }
    if (isFloat(good)) {
      if (isDefined(parsedSchema.eq) && good !== parsedSchema.eq) {
        return `${good} is not the expected value ${parsedSchema.eq}`;
      }
      if (parsedSchema.in && parsedSchema.in.indexOf(good) < 0) {
        return `${good} not in the allowed list ${parsedSchema.in.join(',')}`;
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
    return `${good} is not a number`;
  };
};

const shortUuidRegex = /^[a-fA-F0-9]{32}$/;

const longUuidRegex =
  /^[a-fA-F0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/;

const uuidValidator = function (parsedSchema) {
  return (good) => {
    if (good === null) {
      if (parsedSchema.optional) {
        return false;
      }
      return 'null was supplied, but not allowed';
    }
    if (isString(good)) {
      const len = good.length;
      if (len === 32 && shortUuidRegex.test(good)) {
        return false;
      } else if (len === 36 && longUuidRegex.test(good)) {
        return false;
      }
    }
    return `${good} is not a uuid`;
  };
};

const functionValidator = function (parsedSchema) {
  return (good) => {
    if (good === null) {
      if (parsedSchema.optional) {
        return false;
      }
      return 'null was supplied, but function expected';
    }
    if (isFunction(good)) {
      return false;
    }
    return `${typeof good} is not a function`;
  };
};

const nullValidator = function () {
  return (good) => {
    if (good === null) {
      return false;
    }
    return 'null was expected, but something else was supplied';
  };
};

module.exports = {
  anythingValidator: anythingValidator,
  booleanValidator: booleanValidator,
  stringValidator: stringValidator,
  integerValidator: integerValidator,
  numberValidator: numberValidator,
  uuidValidator: uuidValidator,
  functionValidator: functionValidator,
  nullValidator: nullValidator,
};
