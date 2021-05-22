assert = require 'assert'

{ isString } = require '../src/helpers'
{ inspectForError } = require '../src'
{ anything, notBoolean, notString, notInteger, notFloat, notFunction, notUuid } = require './_generators'

assert_inspect = (schema, value) ->
	assert !isString(inspectForError(schema, value)), "schema #{schema} should validate #{value}"
assert_not_inspect = (schema, value) ->
	assert isString(inspectForError(schema, value)), "schema #{schema} allows #{value}, but that is not okay"
assert_error = (schema, errRegexp) ->
	assert.throws ->
		inspectForError(schema, null)
	,
		errRegexp

describe 'inspection-special', ->
	
	it 'inspect checks for emails', ->
		assert_inspect('email', 'a@b.com')
		assert_inspect('email', 'a@b.com') # Repeated to hit cache
		assert_inspect('email?', null)
		assert_inspect('email!', 'a@b.com')
		assert_inspect('email!gte=-1&lte=10', 'a@b.com')
		assert_inspect('email!gt=-1&lt=10', 'a@b.com')
		assert_inspect('email!eq=a@b.com', 'a@b.com')
		assert_inspect('email!in=a@b.com,b@a.com', 'a@b.com')
		assert_inspect('email!in=a@b.com,b@a.com', 'b@a.com')
		
		assert_not_inspect('email!gte=1&lte=2', 'b@a.com')
		assert_not_inspect('email!gt=1&lt=3', 'b@a.com')
		assert_not_inspect('email!gte=1&lte=2', 'b@a.com')
		assert_not_inspect('email!gt=1&lt=3', 'b@a.com')
		assert_not_inspect('email!eq=abc', 'b@a.com')
		assert_not_inspect('email!eq=abc', '')
		assert_not_inspect('email!in=abc,def', 'b@a.com')
		assert_not_inspect('email!in=abc,def', '')
		assert_not_inspect('email!in=', 'abc')
		assert_not_inspect('email', null)
		assert_not_inspect('email!', null)
		
		return
	
	it 'inspect checks for hex-colors', ->
		assert_inspect('hex-color', '#abcdef')
		
		assert_not_inspect('hex-color!', 'b@a.com')
		assert_not_inspect('hex-color!', 123)
		assert_not_inspect('hex-color!', '#abcDE')
		assert_not_inspect('hex-color!', '#abcDEff')
		
		return
	
	it 'inspect checks for passwords', ->
		assert_inspect('password', '12345678')
		assert_inspect('password', '1234567870487953049875')
		assert_inspect('password', '!#$!@#$%^#$%#$%')
		assert_inspect('password', 'abcdefghijklmnopqrstuvwxyz')
		assert_inspect('password', 'abcDEF123=-asdf')
		
		assert_not_inspect('password', '1234567')
		
		return
