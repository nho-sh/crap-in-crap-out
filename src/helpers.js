module.exports = {
  isFunction: (fnc) => {
    return typeof fnc === 'function';
  },
  isString: (str) => {
    return typeof str === 'string';
  },
  // istanbul ignore next
  isNumber: (number) => {
    return typeof number === 'number' || number instanceof Number;
  },
  isArray: (arr) => {
    return Object.prototype.toString.call(arr) === '[object Array]';
  },
  isDefined: (good) => {
    return good != null;
  },
  jsType(good) {
    if (good === null) {
      return 'null';
    } else if (good === undefined) {
      return 'undefined';
    } else if (Array.isArray(good)) {
      return 'array';
    } else {
      return typeof good;
    }
  },
};
