assert = require 'assert'

{ guard } = require '../src'
{ notString, notInteger } = require './_generators'

assert_guard = (schema, value, output) ->
	assert.deepStrictEqual guard(schema, value), output
# assert_not_guard = (schema, value, errMsg) ->
# 	assert.throws ->
# 		guard(schema, value), "guard #{JSON.stringify schema} has unexpected same output #{JSON.stringify output}"
# 	, new RegExp(errMsg)

describe 'integration', ->
	
	it 'guard works on a list of geopoints', ->
		
		schema = [
			lat: 'float!'
			lng: 'float!'
		]
		
		value = [
			lat: 12
			lng: -21
			someval: 'removed'
		,
			lat: 12
			lng: -21
			extra: 'exclude'
		]
		
		output = [
			lat: 12
			lng: -21
		,
			lat: 12
			lng: -21
		]
		
		assert_guard schema, value, output
	
	it 'guard works on a list of alternating lat/lng', ->
		
		schema = [
			lat: 'float!gte=-90&lte=90'
			lng: 'float!gte=-180&lte=180'
		]
		
		value = [
			# Good lat/lng, but with extra nonsense
			lat: 12
			lng: -21
			someval: 'removed'
		,
			# Bad lat, with extra nonsense
			lat: -100
			lng: -21
			extra: 'exclude'
		]
		
		assert.throws ->
			guard(schema, value)
		,
			/Guard failed: \[1\].lat:float!gte=-90&lte=90 -100 <= -90 evaluated false/
	
	it 'guard works on complex object 1', ->
		
		schema =
			a: 'float!'
			b: [
				a: 'integer!'
				b: 'string'
				'c?': 'boolean?'
			,
				lat: 'float!'
				lng: 'float!'
			]
			c:
				title: 'string?'
		
		value =
			a: 123.0
			b: [
				a: 31
				b: 'cdf'
				c: null
			,
				lat: 12
				lng: -21
			,
				a: 31
				b: 'cdf'
				c: true
			,
				lat: 12
				lng: -21
			]
			c:
				name: 'dilnas'
				title: 'the guard'
		
		output =
			a: 123.0
			b: [
				a: 31
				b: 'cdf'
				c: null
			,
				lat: 12
				lng: -21
			,
				a: 31
				b: 'cdf'
				c: true
			,
				lat: 12
				lng: -21
			]
			c:
				title: 'the guard'
		
		assert_guard schema, value, output
	
	it 'works on the README example', ->
		
		schema = [
			{
				intArray: [ 'integer' ],
				objArray: [
					{
						a: 'float!eq=-0.1',
						"b?": 'integer?'
					}
				],
				string: 'string?gte=3',
				positiveNumber: 'float!gt=0',
				"optionalArray?": [ 'boolean' ]
				"optionalObject?": { a: 'boolean '}
			}
		]
		
		value = [
			intArray: [ 1, 2 ],
			objArray: [
				{ a: -0.1, b: null }
			],
			string: 'abc',
			positiveNumber: 10.123,
			optionalArray: null
			optionalObject: null
		]
		
		output = [
			intArray: [ 1, 2 ],
			objArray: [
				{ a: -0.1, b: null }
			],
			string: 'abc',
			positiveNumber: 10.123,
			optionalArray: null
			optionalObject: null
		]
		
		assert_guard schema, value, output
