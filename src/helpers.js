module.exports = {
  isFunction: (fnc) => {
    return typeof fnc === 'function';
  },
  isString: (str) => {
    return typeof str === 'string' || str instanceof String;
  },

  // istanbul ignore next
  isFloat: (number) => {
    return typeof number === 'number' || number instanceof Number;
  },
  isArray: (arr) => {
    return Object.prototype.toString.call(arr) === '[object Array]';
  },
  isDefined: (good) => {
    return good !== null && good !== void 0;
  },
};
