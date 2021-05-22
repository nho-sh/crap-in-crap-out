assert = require 'assert'

helpers = require '../src/helpers'

describe 'helpers', ->
	
	it 'isInteger', ->
		assert helpers.isInteger(10) == true
		assert helpers.isInteger(10.0)
