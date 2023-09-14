const assert = require('assert');

const { isString } = require('../src/helpers');

const { inspectForError } = require('../src');

const { anything, notBoolean, notString, notInteger, notFloat, notFunction, notUuid } = require('./_generators');

const assert_inspect = function(schema, value) {
  assert(!isString(inspectForError(schema, value)), `schema ${schema} should validate ${value}`);
};

const assert_not_inspect = function(schema, value) {
  assert(isString(inspectForError(schema, value)), `schema ${schema} allows ${value}, but that is not okay`);
};

const assert_error = function(schema, errRegexp) {
  assert.throws(function() {
    inspectForError(schema, null);
  }, errRegexp);
};

describe('inspection', function() {
  it('inspect checks for anything', function() {
    assert_inspect('...', true);
    assert_inspect('...', false);
    assert_inspect('...', false); // Repeated to hit cache
    assert_inspect('...?', null);
    assert_inspect('...!', true);
    assert_not_inspect('...', null);
    assert_not_inspect('...!', null);
    assert_not_inspect('...!', void 0);
    for (let i = 0; i <= 10000; i++) {
      assert('...', anything());
    }
  });
  it('inspect checks for boolean', function() {
    assert_inspect('boolean', true);
    assert_inspect('boolean', false);
    assert_inspect('boolean', false); // Repeated to hit cache
    assert_inspect('boolean?', null);
    assert_inspect('boolean!', true);
    assert_inspect('boolean!eq=true', true);
    assert_inspect('boolean!eq=false', false);
    assert_not_inspect('boolean', null);
    assert_not_inspect('boolean!', null);
    assert_not_inspect('boolean!eq=true', false);
    assert_not_inspect('boolean!eq=false', true);
    for (let i = 0; i <= 10000; i++) {
      assert_not_inspect('boolean', notBoolean());
    }
    assert_error('boolean?eq=nonsense', /boolean\?eq=nonsense has to be eq=true or eq=false/);
  });
  it('inspect checks for strings', function() {
    assert_inspect('string', 'abc');
    assert_inspect('string', 'abc'); // Repeated to hit cache
    assert_inspect('string?', null);
    assert_inspect('string!gte=-1&lte=1', '');
    assert_inspect('string!gt=-1&lt=1', '');
    assert_inspect('string!len=3', 'abc');
    assert_inspect('string!eq=abc', 'abc');
    assert_inspect('string!eq=', '');
    assert_inspect('string!in=abc,def', 'abc');
    assert_inspect('string!in=a,b,c,d', 'd');
    assert_inspect('string!', 'abc');
    assert_inspect('string?regex=abc', 'abc');
    assert_inspect('string!regex=abc', 'abc');
    assert_inspect('string!regex=^abc', 'abc');
    assert_inspect('string!regex=abc$', 'abc');
    assert_inspect('string!regex=^abc$', 'abc');
    assert_inspect('string!regex=abc|def', 'abc');
    assert_inspect('string!regex=abc|def', 'def');
    assert_not_inspect('string!gte=1&lte=2', 'xxx');
    assert_not_inspect('string!gt=1&lt=3', 'xxx');
    assert_not_inspect('string!gte=1&lte=2', '');
    assert_not_inspect('string!gt=1&lt=3', '');
    assert_not_inspect('string!len=2', 'abc');
    assert_not_inspect('string!len=4', 'abc');
    assert_not_inspect('string!eq=abc', 'def');
    assert_not_inspect('string!eq=abc', '');
    assert_not_inspect('string!in=abc,def', 'a');
    assert_not_inspect('string!in=abc,def', 'abc,');
    assert_not_inspect('string!in=abc,def', '');
    assert_not_inspect('string!in=', 'abc');
    assert_not_inspect('string!regex=abc', 'def');
    assert_not_inspect('string!regex=^abc', 'def');
    assert_not_inspect('string', null);
    assert_not_inspect('string!', null);
    for (let i = 0; i <= 10000; i++) {
      assert_not_inspect('string', notString());
    }
  });
  it('inspect checks for integers', function() {
    assert_inspect('integer', 10);
    assert_inspect('integer', -10);
    assert_inspect('integer', 0);
    assert_inspect('integer?', null);
    assert_inspect('integer!gte=-1&lte=1', -1);
    assert_inspect('integer!gte=-1&lte=1', 0);
    assert_inspect('integer!gt=-1&lt=1', 0);
    assert_inspect('integer!eq=10', 10);
    assert_inspect('integer!eq=-0', 0);
    assert_inspect('integer!eq=-1', -1);
    assert_inspect('integer!in=0,10,-10', -10);
    assert_inspect('integer!', 0);
    assert_not_inspect('integer!gte=-1&lte=1', -2);
    assert_not_inspect('integer!gte=-1&lte=1', 2);
    assert_not_inspect('integer!gt=-1&lt=1', -2);
    assert_not_inspect('integer!gt=-1&lt=1', 2);
    assert_not_inspect('integer', 10.1);
    assert_not_inspect('integer', -10.1);
    assert_not_inspect('integer', 0.01);
    assert_not_inspect('integer!eq=10', 'def');
    assert_not_inspect('integer!eq=10', '');
    assert_not_inspect('integer!eq=10', 9);
    assert_not_inspect('integer!in=0,10,-10', -20);
    assert_not_inspect('integer!eq=10&in=0,10,-10', -20);
    assert_not_inspect('integer', null);
    assert_not_inspect('integer!', null);
    assert_error('integer!eq=', /integer!eq= is not an integer: eq=/);
    assert_error('integer?eq=nonsense', /integer\?eq=nonsense is not an integer: eq=nonsense/);
    assert_error('integer!in=', /integer!in= is not a integer: in=/);
    for (let i = 0; i <= 10000; i++) {
      assert_not_inspect('integer', notInteger());
    }
  });
  it('inspect checks for numbers', function() {
    assert_inspect('number', 10.1);
    assert_inspect('number', -10.1);
    assert_inspect('number', 10);
    assert_inspect('number', 0);
    assert_inspect('number?', null);
    assert_inspect('number!gte=-1&lte=1', -1);
    assert_inspect('number!gte=-1&lte=1', 0.5);
    assert_inspect('number!gte=-1&lte=1', 1);
    assert_inspect('number!gt=-1&lt=1', -0.9);
    assert_inspect('number!gt=-1&lt=1', 0);
    assert_inspect('number!gt=-1&lt=1', 0.9);
    assert_inspect('number!eq=1.1', 1.1);
    assert_inspect('number!eq=0.0', 0);
    assert_inspect('number!eq=-10.0', -10);
    assert_inspect('number!in=0.1,10.2,-10.3', -10.3);
    assert_inspect('number!eq=-10.3&in=0.1,10.2,-10.3', -10.3);
    assert_inspect('number!', 10.1);
    assert_not_inspect('number!gte=-1&lte=1', -1.1);
    assert_not_inspect('number!gte=-1&lte=1', 1.1);
    assert_not_inspect('number!gt=-1&lt=1', -1.1);
    assert_not_inspect('number!gt=-1&lt=1', 1.1);
    assert_not_inspect('number!eq=1.01', '1.02');
    assert_not_inspect('number!eq=1.01', 1.02);
    assert_not_inspect('number!in=0.1,10.2,-10.3', -20);
    assert_not_inspect('number', null);
    assert_not_inspect('number!', null);
    assert_error('number!eq=', '12', /number!eq= is not a number: eq=/);
    assert_error('number?eq=nonsense', /number\?eq=nonsense is not a number: eq=nonsense/);
    assert_error('number!in=', /number!in= is not a number: in=/);
    for (let i = 0; i <= 10000; i++) {
      assert_not_inspect('number', notFloat());
    }
  });
  it('inspect checks for functions', function() {
    assert_inspect('function', function() {});
    assert_inspect('function', new Function());
    assert_inspect('function?', null);
    assert_inspect('function!', function() {});
    assert_not_inspect('function', 'abc');
    assert_not_inspect('function', '00000000-000000000000000000000000');
    assert_not_inspect('function', 123);
    assert_not_inspect('function', 123.0);
    assert_not_inspect('function!', null);
    assert_not_inspect('function!', false);
    for (let i = 0; i <= 10000; i++) {
      assert_not_inspect('function', notFunction());
    }
  });
  it('inspect checks for uuid', function() {
    assert_inspect('uuid', '00000000-0000-0000-0000-000000000000');
    assert_inspect('uuid', '58c29992-85f6-11ea-bc55-0242ac130003');
    assert_inspect('uuid', '6d7c4c8e-85f6-11ea-bc55-0242ac130003');
    assert_inspect('uuid', '4fdf3413-05f9-4558-9177-8fd4edbb9574');
    assert_inspect('uuid', 'dfac64b0-440a-4d6e-b25b-55ec77a30dd4');
    assert_inspect('uuid', 'dfac64b0440a4d6eb25b55ec77a30dd4');
    assert_inspect('uuid', '00000000000000000000000000000000');
    assert_inspect('uuid?', null);
    assert_inspect('uuid!', '00000000-0000-0000-0000-000000000000');
    assert_not_inspect('uuid', 'abc');
    assert_not_inspect('uuid', '00000000-000000000000000000000000');
    assert_not_inspect('uuid', 123);
    assert_not_inspect('uuid!', null);
    for (let i = 0; i <= 10000; i++) {
      assert_not_inspect('uuid', notUuid());
    }
  });
});
