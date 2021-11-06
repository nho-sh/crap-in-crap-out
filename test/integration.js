const assert = require('assert');

const { guard } = require('../src');

const { notString, notInteger } = require('./_generators');

const assert_guard = function(schema, value, output) {
  return assert.deepStrictEqual(guard(schema, value), output);
};

// assert_not_guard = (schema, value, errMsg) ->
// 	assert.throws ->
// 		guard(schema, value), "guard #{JSON.stringify schema} has unexpected same output #{JSON.stringify output}"
// 	, new RegExp(errMsg)
describe('integration', () => {
  it('guard works on a list of geopoints', () => {
    var output, schema, value;
    schema = [
      {
        lat: 'number!',
        lng: 'number!'
      }
    ];
    value = [
      {
        lat: 12,
        lng: -21,
        someval: 'removed'
      },
      {
        lat: 12,
        lng: -21,
        extra: 'exclude'
      }
    ];
    output = [
      {
        lat: 12,
        lng: -21
      },
      {
        lat: 12,
        lng: -21
      }
    ];
    return assert_guard(schema, value, output);
  });
  it('guard works on a list of alternating lat/lng', () => {
    var schema, value;
    schema = [
      {
        lat: 'number!gte=-90&lte=90',
        lng: 'number!gte=-180&lte=180'
      }
    ];
    value = [
      {
        // Good lat/lng, but with extra nonsense
        lat: 12,
        lng: -21,
        someval: 'removed'
      },
      {
        // Bad lat, with extra nonsense
        lat: -100,
        lng: -21,
        extra: 'exclude'
      }
    ];
    return assert.throws(() => {
      return guard(schema, value);
    }, /Guard failed: \[1\].lat:number!gte=-90&lte=90 -100 <= -90 evaluated false/);
  });
  it('guard works on complex object 1', () => {
    var output, schema, value;
    schema = {
      a: 'number!',
      b: [
        {
          a: 'integer!',
          b: 'string',
          'c?': 'boolean?'
        },
        {
          lat: 'number!',
          lng: 'number!'
        }
      ],
      c: {
        title: 'string?'
      }
    };
    value = {
      a: 123.0,
      b: [
        {
          a: 31,
          b: 'cdf',
          c: null
        },
        {
          lat: 12,
          lng: -21
        },
        {
          a: 31,
          b: 'cdf',
          c: true
        },
        {
          lat: 12,
          lng: -21
        }
      ],
      c: {
        name: 'dilnas',
        title: 'the guard'
      }
    };
    output = {
      a: 123.0,
      b: [
        {
          a: 31,
          b: 'cdf',
          c: null
        },
        {
          lat: 12,
          lng: -21
        },
        {
          a: 31,
          b: 'cdf',
          c: true
        },
        {
          lat: 12,
          lng: -21
        }
      ],
      c: {
        title: 'the guard'
      }
    };
    assert_guard(schema, value, output);
  });
  return it('works on the README example', () => {
    var output, value;
    const schema = [
      {
        intArray: ['integer'],
        objArray: [
          {
            a: 'number!eq=-0.1',
            "b?": 'integer?'
          }
        ],
        string: 'string?gte=3',
        positiveNumber: 'number!gt=0',
        "optionalArray?": ['boolean'],
        "optionalObject?": {
          a: 'boolean '
        }
      }
    ];
    value = [
      {
        intArray: [1,
      2],
        objArray: [
          {
            a: -0.1,
            b: null
          }
        ],
        string: 'abc',
        positiveNumber: 10.123,
        optionalArray: null,
        optionalObject: null
      }
    ];
    output = [
      {
        intArray: [1,
      2],
        objArray: [
          {
            a: -0.1,
            b: null
          }
        ],
        string: 'abc',
        positiveNumber: 10.123,
        optionalArray: null,
        optionalObject: null
      }
    ];
    assert_guard(schema, value, output);
  });
});
