const assert = require('assert');

const { guardian } = require('../src');
const { notAFunction } = require('../src/errors');

describe('guardian', function () {
  it('guardian checks input', function () {
    assert.throws(function () {
      return guardian(null, null);
    }, /Function got no schema's to validate with, pass either input or out schema, or both./);
    assert.throws(function () {
      return guardian({}, {}, {});
    }, /Function only excepts input_schema and out_schema, no further arguments. You supplied 3/);
    assert.throws(function () {
      return guardian({}, {});
    }, /Function input schema always needs to be an array of schemas, one for each input argument. It can also be null or undefined./);
    assert.throws(function () {
      return guardian([{}], {})({});
    }, new RegExp(notAFunction));
  });
  it('guardian works on empty schemas', function () {
    return guardian([{}], {})(function () {});
  });
  it('guardian works on output schemas only', function () {
    return guardian(
      null,
      'integer'
    )(function () {
      return 10;
    })();
  });
  it('guardian works on input schemas only', function () {
    return guardian([{}])(function () {})();
  });
  it('guardian properly validates inputs and outputs', function () {
    const dinlas = guardian(['integer'], 'integer');
    const elevenPercent = dinlas(function (arg1, arg2) {
      return (arg1 + arg2) * 1.1;
    });
    assert(elevenPercent(10, 0) === 11);

    // Check for proper output validation
    // elevenPercent(10, 1) => 12.1
    assert.throws(function () {
      return elevenPercent(10, 1) === 11;
    }, /12.100000000000001 is not an integer @ /);

    // Check for proper input validation
    assert.throws(function () {
      return elevenPercent(10, 1.1);
    }, /1.1 is not an integer @ \[1\]/);
  });
});
