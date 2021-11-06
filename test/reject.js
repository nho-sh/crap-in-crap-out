const assert = require('assert');

const { reject } = require('../src');

const { inspectFailed } = require('../src/errors');

describe('rejection', function() {
  it('reject ignores valid inspections', function() {
    reject('string', 'abc');
  });
  it('reject throws errors on bad inspections', function() {
    assert.throws(function() {
      reject('string', 1);
    }, /Not a string: 1/);
  });
});
