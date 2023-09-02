module.exports = {
  
  // isError: (err) ->
  // 	toString.call(err) == '[object Error]'
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
    // simpler version of _.isArray
    // TODO consider including lodash anyway
    return arr && typeof arr !== 'function' && typeof arr.length === 'number';
  },
  isDefined: (good) => {
    return good !== null && good !== void 0;
  }
};
