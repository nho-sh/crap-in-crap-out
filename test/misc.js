const assert = require('assert');

const helpers = require('../src/helpers');

describe('helpers', function() {
  return it('isInteger', function() {
    assert(helpers.isInteger(10) === true);
    return assert(helpers.isInteger(10.0));
  });
});
