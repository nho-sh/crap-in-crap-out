assert = require 'assert'

{ reject } = require '../src'
{ inspectFailed } = require '../src/errors'

describe 'rejection', ->
	
	it 'reject ignores valid inspections', ->
		
		reject('string', 'abc')
	
	it 'reject throws errors on bad inspections', ->
		
		assert.throws ->
			reject('string', 1)
		,
			/Not a string: 1/
