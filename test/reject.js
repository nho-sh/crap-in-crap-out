const assert = require('assert');

const { reject } = require('../src');

describe('rejection', function () {
  it('reject ignores valid inspections', function () {
    reject('string', 'abc');
  });
  it('reject throws errors on bad inspections', function () {
    assert.throws(function () {
      reject('string', 1);
    }, /1 is not a string/);
  });
});
