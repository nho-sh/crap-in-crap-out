fs = require 'fs'
path = require 'path'

testfiles = fs.readdirSync(__dirname).filter (file) ->
	return file[0] != '_' && file.indexOf('.coffee') > 0

testfiles.forEach (f) ->
	require __dirname + '/' + f
