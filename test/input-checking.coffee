assert = require 'assert'

{ inspectForError, guard } = require '../src'
{ notAFunction, notAGoodSchema } = require '../src/errors'

describe 'input-checking', ->
	
	# it 'guard only accepts functions', ->
		
	# 	badStuff = [
	# 		null
	# 		undefined
	# 		'abc'
	# 		''
	# 		[]
	# 		{}
	# 		10.0
	# 		10
	# 		false
	# 	]
		
	# 	badStuff.forEach (bs) ->
	# 		assert.throws ->
	# 			guard(null) bs
	# 		,
	# 			new RegExp(notAFunction)
	
	it 'inspectForError only accepts strings as schema', ->
		
		badStuff = [
			null
			undefined
			[]
			{}
			10.0
			10
			false
		]
		
		badStuff.forEach (bs) ->
			assert.throws ->
				inspectForError(bs, null)
			,
				new RegExp(notAGoodSchema)
	
	it 'inspectForError check for duplicate values in a field validator', ->
		assert.throws ->
			inspectForError('number?gte=1&gte=1', null)
		,
			/has this value multiple times/
	
	it 'inspectForError check for bad numbers in a field validtor', ->
		assert.throws ->
			inspectForError('number?gte=abc', null)
		,
			/has a non-number/
	
	it 'inspectForError check bad validator types', ->
		assert.throws ->
			inspectForError('numberpointnumber?', null)
		,
			/Failed to parse schema/
