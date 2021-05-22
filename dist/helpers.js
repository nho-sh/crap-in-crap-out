// Generated by CoffeeScript 2.5.1
(function() {
  module.exports = {
    
    // isError: (err) ->
    // 	toString.call(err) == '[object Error]'
    isFunction: function(fnc) {
      return typeof fnc === 'function';
    },
    isString: function(str) {
      return typeof str === 'string' || str instanceof String;
    },
    
    // istanbul ignore next
    isInteger: Number.isInteger || function(int) {
      // istanbul ignore next
      return typeof int === 'number' && isFinite(int) && Math.floor(int) === int;
    },
    
    // istanbul ignore next
    isFloat: function(float) {
      return typeof float === 'number' || float instanceof Number;
    },
    isArray: function(arr) {
      // simpler version of _.isArray
      // consider including lodash anyway
      return arr && typeof arr !== 'function' && typeof arr.length === 'number';
    },
    isDefined: function(good) {
      return good !== null && good !== void 0;
    }
  };

}).call(this);
