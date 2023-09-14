# Crap In === Crap Out

This is a **strict JSON validator** with a very simple, wysiwyg, human friendly schema.

It's contrary to the defensive programming paradigm, which aims to be flexible on input.
Instead, by demanding strict input, calling code has to adhere 100% to the contract,
and there are no surprises or side effects.

The schema definitions are written analogous to the data structure itself,
including the arrays and objects. Every level of the real JSON data,
is mirrored by the exact same level of validation level.

```js
// data.json
[
	{
		"intArray": [ 1, 2 ],
		"objArray": [
			{ "a": -0.1, "b": null }
		],
		"string": "abc",
		"positiveNumber": 10.123,
		"optionalArray?": null,
		"optionalObject?": null
	}
]

// example.js
const data = require('./data.json');
const { guard } = require('crap-in-crap-out');

const validationSchema =
// Top level, we want an array
[
	// Every element in the array adheres to this object
	{
		intArray: [ 'integer' ],
		objArray: [
			{
				// Required! number equal to -0.1
				a: 'number!eq=-0.1',
				
				// Optional? UUID
				b: 'uuid?'
			}
		],
		
		// Optional? string with a minimum length of 3
		string: 'string?gte=3',
		
		// Required! number above 0
		positiveNumber: 'number!gt=0',
		
		// A trailing ? on a object key, means the value can be null
		"optionalArray?": [ 'boolean' ],
		
		// A trailing ? on a object key, means the value can be null
		"optionalObject?": { a: 'boolean' }
	}
	
	// If you define a 2nd array element
	// The array element validation will alternate
	// between them.
	// { 2nd position elements look like this }
	
	// Every 3rd could a number if you like
	// 'string?'
]

// Throws error if it's not validated
const validatedData = guard(validationSchema, data);
```

## Validation Definition

As you can see in the example, validations are writting as HTTP Queries:

`<type>?condition=1&...`

A format that is well know and easy enough to read.

## Validation : Basic Types

- `...` -> Allow anything that is not nill
    - `...?` Allow anything, even null/undefined
- `boolean` -> Allow true/false
    - `boolean?` Allow true/false/null/undefined
- `string`
    - ... todo
- `integer`
    - ... todo
- `number`
    - ... todo
- `function`
    - ... todo

## Validation : Special Types

Some common special types are also supported out of the box

- `uuid` (no specific version checking, like v1, v4, ...)
    - ... todo
- `email`
    - ... todo
- `jwt`
    - ... todo
- `hex-color`
    - ... todo
- `timestamp-iso8601-ms`
    - The timestamp defined by ISO8601, but including .000 milliseconds
    - Uses the Z suffix, not +00:00
- `password`
    - ... todo

## Performance

Each validation is converted internally to a cached function,
for fast evaluation. Also, because it's cached, identical validations
use the same functions, reducing memory footprint.
