# Crap In === Crap Out

This is a **strict JSON validator** with a very simple, wysiwyg, human friendly schema.

It's contrary to the defensive programming paradigm, which aims to be flexible on input.
Instead, by demanding strict input, calling code has to adhere 100% to the contract,
and there are no surprises or side effects. There is one concession: extraneous
fields are silently dropped.

The schema definitions are written analogous to the JSON data structure itself,
including the arrays and objects. Every level of the real JSON data,
is mirrored by the exact same validation level.

```js
const { guard } = require('crap-in-crap-out');

// Let's validate this array with one object:
const data = [
  {
    oneAndTwo: [1, 2],
    objArray: [{ a: -0.1, b: null }],
    string: 'abc',
    positiveNumber: 10.123,
    optionalArray: null,
    optionalObject: null,

    extra_field: 'will be filtered out',
  },
];

// This is the JSON schema: it matches the same structure
// and is just plain JSON
const validationSchema = [
  // Every element in the array adheres to this object
  {
    oneAndTwo: ['integer'],
    objArray: [
      {
        // Fields are type checked.
        // Exclamation (!) makes the field required
        // While Question mark (?) makes the field optional
        // After ? or ! you can constrain the value
        a: 'number!eq=-0.1',
        // Question mark makes it optional
        b: 'uuid?',
      },
    ],

    // Optional? string with a minimum length of 3
    string: 'string?gte=3',

    // Required! number above 0
    positiveNumber: 'number!gt=0',

    // A trailing ? on a object key, means the value can be null
    'optionalArray?': ['boolean'],

    // A trailing ? on a object key, means the value can be null
    'optionalObject?': { a: 'boolean' },
  },

  // Arrays only accept one element. Exta elements
  // will result in an Error thrown.
];

// Throws error if it's not validated
// If valid, returns a deep clone with the fields that match the schema
const validatedData = guard(validationSchema, data);

// If valid, the result is JSON data without any unexpected input
// From the input data, the field 'extra_field' will be gone
```

## Validation Definition

As you can see in the example, validations are written similar to HTTP queries:

`<type>?condition=1&...`

A format that is well know and easy enough to read.

## Validation : Basic Types

| Type | Constraints | |
|---|---|---|
| `boolean`   | Allow true/false | |
| `boolean?`  | Allow true/false/null/undefined | |
| | | |
| `string`    | `gte=` `gt=` | minimum length |
| `string!`   | `lte=` `lt=` | maximum length |
| `string?`   | `len=` | exact length |
|             | `eq=` | exact string value |
|             | `in=` | in a comma-separated string list |
|             | `regex=` | matches a regex. If you are troubled with encoding issues you can do: `string?regex=${encodeURIComponent('\\+?[\\d\\s]+')}`. |
| | | |
| `integer`   | `gte=` `gt=` | above a integer value |
| `integer!`   | `lte=` `lt=` | below a integer value |
| `integer?`   | `eq=` | equal to a integer value |
| | `in=` | in a comma-separated integer list. Invalid values in the schema will result in an Error thrown. |
| | | |
| `number`   | `gte=` `gt=` | above a number value |
| `number!`   | `lte=` `lt=` | below a number value |
| `number?`   | `eq=` | equal to a number value |
| | `in=` | in a comma-separated number list. Invalid values in the schema will result in an Error thrown. |
| | | |
| `function`  | ... todo | |
| | | |
| `null`      | Only allow `null` | |
| | | |
| `...`       | Allow anything that is not nil | |
| | | |
| `...?`      | Allow anything, even null/undefined | |

## Validation : Special types

Some common special types are also supported out of the box

| Type | Meaning |
|---|---|
| `uuid` | checks if its a 32 or 36 character string with hexadecimal characters (case insensitive). No support for versions such as v1, v4, ... |
| `email` | very basic alpha-numeric e-mail check, uses a simple regex |
| `jwt` | Simply checks if it looks like a JWT string. Does not decode or verify. Handy for initial input checking, but is not security. |
| `hex-color` | case-insensitive 6 long hexadecimal color starting with `#` |
| `timestamp-iso8601-ms` | ISO8601 timestamp including `.000` milliseconds; must use the `Z` suffix (not `+00:00`) |

## Errors

When a validation does not pass, the library throws an Error instance.
The error message will describe the problem in a human friendly way,
but the Error instance will also have a field `path` that documents
the path inside the validated data, and pinpoint the location of
the first validation error.

This path is compatible with lodash `_.get`, for example:

- `-100 <= -90 evaluated false @ [1].lat` says that the object at array index 1,
  has a incorrect value -100 in field `lat`.

## Performance

Each field validation is converted internally to a cached function,
for fast evaluation. Because it's cached, identical validations
use the same generated functions, reducing memory footprint.
