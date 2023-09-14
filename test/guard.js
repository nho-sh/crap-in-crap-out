const assert = require('assert');

const { guard } = require('../src');

// { notAFunction, notAGoodSchema } = require '../src/errors'
const { notString, notInteger } = require('./_generators');

const assert_guard = function(schema, value, output) {
  assert.deepStrictEqual(guard(schema, value), output);
};

const assert_not_guard = function(schema, value) {
  assert.notDeepStrictEqual(guard(schema, value), `guard ${JSON.stringify(schema)} has unexpected same output ${JSON.stringify(output)}`);
};

describe('guard', () => {
  it('guard works on empty schemas', () => {
    assert_guard({}, {}, {});
  });
  it('guard works on direct checks', () => {
    assert_guard('number?', null, null);
    assert_guard('number?', 123, 123);
  });
  it('guard works on simple schemas', () => {
    let fnc = () => {};
    
    const schema = {
      a: 'string',
      b: 'integer',
      c: '...',
      'd?': '...?',
      e: '...!',
      zero: 'integer!gte=0&lte=2'
    };
    const value = {
      a: 'abc',
      b: 10,
      c: fnc,
      d: null,
      e: 12,
      zero: 0,
    };

    const guarded = guard(schema, value);

    const output = {
      a: 'abc',
      b: 10,
      c: guarded.c,
      d: null,
      e: 12,
      zero: 0,
    };
    
    // Because of the scope binding on functions,
    // we have to make a special variant of asserting
    assert.deepStrictEqual(guarded, output);
  });
  it('guard checks for invalid keys', () => {
    assert.throws(() => {
      return guard({
        a: 'string',
        b: 'integer'
      }, {
        a: 'abc',
        b: 'badvalue'
      });
    }, /Guard failed: b:integer Not an integer: badvalue/);
  });
  it('guard checks for invalid types', () => {
    assert.throws(() => {
      return guard({
        a: 'strAng',
      }, {
        a: 'abc',
      });
    }, /Error: Guard failed: aError: Failed to parse schema strAng/);
  });
  it('guard allows null when its optional', () => {
    assert_guard({
      a: 'string',
      'b?': 'integer',
      c: 'integer?'
    }, {
      a: 'abc',
      b: null,
      c: null
    }, {
      a: 'abc',
      b: null,
      c: null
    });
  });
  it('guard works on arrays', () => {
    assert_guard(['integer'], [], []);
    assert_guard([
      'string',
      'integer',
      {
        a: 'string',
        b: 'integer'
      },
      {
        a: 'integer',
        b: 'string'
      }
    ], [
      'abc',
      10,
      {
        a: 'abc',
        b: 10
      },
      {
        a: 10,
        b: 'abc'
      }
    ], [
      'abc',
      10,
      {
        a: 'abc',
        b: 10
      },
      {
        a: 10,
        b: 'abc'
      }
    ]);
  });
  it('guard works on arrays', () => {
    assert.throws(() => {
      return guard(['string', 'integer'], ['abc', 10, 'abc', 1.23]);
    }, /Guard failed: \[3\]:integer Not an integer: 1.23/);
  });
  it('guard warns about missing schemas', () => {
    assert.throws(() => {
      return guard([], [
        {
          a: 1
        }
      ]);
    }, /No schema\(s\) defined in the array/);
  });
  it('guard warns about array length mismatches', () => {
    assert.throws(() => {
      return guard([
        {
          a: 1
        },
        {
          b: 1
        }
      ], [
        {
          a: 1
        },
        {
          b: 1
        },
        {
          a: 1
        }
      ]);
    }, /is not a multiple of the schema arraylength/);
  });
  it('guard warns about missing array goods', () => {
    assert.throws(() => {
      return guard([
        {
          a: 1
        }
      ], {});
    }, /Value is not an array/);
  });
  it('guard warns about bad field validators', () => {
    assert.throws(() => {
      return guard([
        {
          a: 'numberingpointnumber!'
        }
      ], [
        {
          a: 0.1
        }
      ]);
    }, /Guard failed: \[0\].aError: Failed to parse schema numberingpointnumber!/);
  });
  it('guard works on nested schemas', () => {
    assert.throws(() => {
      return guard({
        a: 'string',
        b: {
          c: 'integer',
          d: 'integer'
        }
      }, {
        a: 'abc',
        b: {
          c: 10,
          d: 'badvalue'
        }
      });
    }, /Guard failed: b.d:integer Not an integer: badvalue/);
  });
  it('guard checks if a nested object is present', () => {
    assert.throws(() => {
      return guard({
        a: 'string',
        b: {
          c: 'integer?',
          d: 'integer?'
        }
      }, {
        a: 'abc',
        b: null
      });
    }, /Guard failed: b:Value is not an object/);
  });
  it('guard checks if a nested array is present', () => {
    assert.throws(() => {
      return guard({
        a: 'string',
        b: [
          {
            c: 'integer?'
          }
        ]
      }, {
        a: 'abc',
        b: void 0
      });
    }, /Guard failed: b:Value is not an array/);
  });
  it('guard allows optional keys 1', () => {
    return guard({
      a: 'string',
      "b?": {
        c: 'integer?',
        d: 'integer?'
      }
    }, {
      a: 'abc',
      b: null
    });
  });
  it('guard allows optional keys 2', () => {
    return guard({
      a: 'string',
      'b?': {
        c: 'integer?',
        'd?': 'integer?'
      }
    }, {
      a: 'abc',
      b: {
        c: 10,
        d: void 0
      }
    });
  });
  it('guard checks for missing object value', () => {
    assert.throws(() => {
      return guard({
        a: 'string',
        'b?': {
          c: 'integer?',
          'd?': 'integer?'
        }
      }, null);
    }, /Value is not an object/);
  });
});
