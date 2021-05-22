assert = require 'assert'

{ guardian } = require '../src'
{ notAFunction } = require '../src/errors'
{ notString, notInteger } = require './_generators'

describe 'guardian', ->
	
	it 'guardian checks input', ->
		
		assert.throws ->
			guardian null, null
		,
			/Guardian got no schema's to validate with, pass either input or out schema, or both./
		
		assert.throws ->
			guardian {}, {}, {}
		,
			/Guardian only excepts input_schema and out_schema, no further arguments. You supplied 3/
		
		assert.throws ->
			guardian {}, {}
		,
			/Guardian input schema always needs to be an array of schemas, one for each input argument. It can also be null or undefined./
		
		assert.throws ->
			guardian([{}], {}) {}
		,
			new RegExp(notAFunction)
	
	it 'guardian works on empty schemas', ->
		guardian([{}], {})(->)
	
	it 'guardian works on output schemas only', ->
		guardian(null, 'integer')(-> 10)()
	
	it 'guardian works on input schemas only', ->
		guardian([{}])(->)()
	
	it 'guardian properly validates inputs and outputs', ->
		dinlas = guardian([ 'integer', 'integer'], 'integer')
		
		elevenPercent = dinlas (arg1, arg2) ->
			(arg1 + arg2) * 1.1
		
		assert elevenPercent(10, 0) == 11
		
		# Check for proper output validation
		# elevenPercent(10, 1) => 12.1
		assert.throws ->
			elevenPercent(10, 1) == 11
		,
			/:integer Not an integer/
		
		# Check for proper input validation
		assert.throws ->
			elevenPercent(10, 1.1)
		,
			/Guarding input failed \[1\]:integer Not an integer: 1.1/
