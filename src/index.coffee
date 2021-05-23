querystring = require 'querystring'

{ isString, isFunction, isInteger, isFloat, isArray, isDefined } = require './helpers'
{
	notAFunction
	notAGoodSchema
	schemaDuplicateValues
	badSchemaNumber
} = require './errors'

parseRegex = /^(boolean|string|integer|number|uuid|function|email|hex-color|jwt|password|bytesize)([!?]|$)(.*)/
schemaParser = (schema) ->
	if !isString(schema)
		throw new Error notAGoodSchema
	
	if schema[0] == '.' && (schema == '...' || schema == '...?' || schema == '...!')
		return { source: schema, type: 'anything', optional: (schema.indexOf('?') == 3) }
	
	match = parseRegex.exec(schema)
	if !match
		throw new Error "Failed to parse schema #{schema}"
	
	type     = match[1]
	optional = match[2] == '?'
	query    = querystring.parse match[3]
	
	# Check if any key in the schema is defined double: gte=1&gte=0
	Object.values(query).forEach (val) ->
		if !isString(val)
			throw new Error schemaDuplicateValues(schema, val)
	
	getNum = (str) ->
		return null if str == undefined
		number = parseFloat(str)
		if isNaN number
			throw new Error badSchemaNumber(schema, str)
		return number
	
	# Parse out some numbers and check if they make sense
	gte = getNum query.gte
	gt  = getNum query.gt
	len = getNum query.len
	lte = getNum query.lte
	lt  = getNum query.lt
	eq  = query.eq
	ins = query.in
	regex = if !query.regex then null else
		result = query.regex.trim()
		prepend = '^' if result[0] != '^'
		append  = '$' if result[result.length - 1] != '$'
		new RegExp((prepend||'') + result + (append||''))
	
	if type == 'boolean'
		return { source: schema, type: 'boolean',   optional, eq }
	
	else if type == 'string'
		return { source: schema, type: 'string',    optional, gte, lte, len, gt, lt, eq, in: ins, regex }
	
	else if type == 'integer'
		return { source: schema, type: 'integer',   optional, gte, lte, gt, lt, eq, in: ins }
	
	else if type == 'number'
		return { source: schema, type: 'number',     optional, gte, lte, gt, lt, eq, in: ins }
	
	else if type == 'function'
		return { source: schema, type: 'function',  optional }
	
	else if type == 'uuid'
		# TODO: can extend with v1 v4, etc
		return { source: schema, type: 'uuid',      optional }
	
	# Special types
	else if type == 'email'
		return { source: schema, type: 'string',    optional, gte, lte, gt, lt, eq, in: ins, regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ }
	else if type == 'jwt'
		return { source: schema, type: 'string',    optional, regex: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/ }
	else if type == 'hex-color'
		return { source: schema, type: 'string',    optional, regex: /^#[A-Fa-f0-9]{6}$/ }
	else if type == 'password'
		return { source: schema, type: 'string',    optional, gte: 8 }
	else if type == 'bytesize'
		return { source: schema, type: 'string',    optional, regex:
			new RegExp([
				"^"
				# A positive number 000.123...
				"[0-9]+(\\.[0-9]+)?("
				# Allow optional spacing
				"\\s*("
				# Base unit
				"B"
				# Decimal based namings
				"|kB|kilobyte|MB|megabyte|GB|gigabyte|TB|terabyte|PB|petabyte|EB|exabyte|ZB|zettabyte|YB|yottabyte"
				# Binary based namings
				"|KiB|kibibyte|MiB|mebibyte|GiB|gibibyte|TiB|tebibyte|PiB|pebibyte|EiB|exbibyte|ZiB|zebibyte|YiB|yobibyte"
				# Unit is optional -> Just bytes?
				"))?"
				"$"
			].join(''))
		}

anythingValidator = (parsedSchema) ->
	return (good) ->
		if good == null || good == undefined
			return false if parsedSchema.optional
			return "#{good} was supplied, but not allowed"
		
		# Allow anything
		return false

booleanValidator = (parsedSchema) ->
	return (good) ->
		if good == null
			return false if parsedSchema.optional
			return "null was supplied, but not allowed"
		
		if isDefined(parsedSchema.eq) && good != parsedSchema.eq
			return "Not the expected value #{parsedSchema.eq}"
		
		return false if good == true || good == false
		return "Not a boolean: #{good}"

stringValidator = (parsedSchema) ->
	return (good) ->
		if good == null
			return false if parsedSchema.optional
			return "null was supplied, but not allowed"
		
		if isString good
			
			if isDefined(parsedSchema.eq) && good != parsedSchema.eq
				return "Not the expected value #{parsedSchema.eq}"
			
			if isDefined(parsedSchema.len)
				realLen = good.length
				if realLen != parsedSchema.len
					return "Expecting value length #{parsedSchema.len} but got #{realLen}"
			
			if parsedSchema.in && good not in parsedSchema.in
				return "Value #{good} not in the allowed list #{parsedSchema.in.join(',')}"
			
			if parsedSchema.regex && !parsedSchema.regex.test(good)
				return "Value #{good} does not match the regular expression #{parsedSchema.regex.toString()}"
			
			len = good.length
			return "#{len} <= #{parsedSchema.gte} evaluated false" if parsedSchema.gte && len <  parsedSchema.gte
			return "#{len} < #{parsedSchema.gt} evaluated false"   if parsedSchema.gt  && len <= parsedSchema.gt
			return "#{len} >= #{parsedSchema.lte} evaluated false" if parsedSchema.lte && len >  parsedSchema.lte
			return "#{len} > #{parsedSchema.lt} evaluated false"   if parsedSchema.lt  && len >= parsedSchema.lt
			return false
		
		return "Not a string: #{good}"

integerValidator = (parsedSchema) ->
	return (good) ->
		if good == null
			return false if parsedSchema.optional
			return "null was supplied, but not allowed"
		
		if isInteger good
			
			if isDefined(parsedSchema.eq) && good != parsedSchema.eq
				return "Not the expected value #{parsedSchema.eq}"
			
			if parsedSchema.in && good not in parsedSchema.in
				return "Value #{good} not in the allowed list #{parsedSchema.in.join(',')}"
			
			return "#{good} <= #{parsedSchema.gte} evaluated false" if parsedSchema.gte && good <  parsedSchema.gte
			return "#{good} < #{parsedSchema.gt} evaluated false"   if parsedSchema.gt  && good <= parsedSchema.gt
			return "#{good} >= #{parsedSchema.lte} evaluated false" if parsedSchema.lte && good >  parsedSchema.lte
			return "#{good} > #{parsedSchema.lt} evaluated false"   if parsedSchema.lt  && good >= parsedSchema.lt
			return false
		
		return "Not an integer: #{good}"

numberValidator = (parsedSchema) ->
	
	return (good) ->
		if good == null
			return false if parsedSchema.optional
			return "null was supplied, but not allowed"
		
		if isFloat good
			
			if isDefined(parsedSchema.eq) && good != parsedSchema.eq
				return "Not the expected value #{parsedSchema.eq}"
			
			if parsedSchema.in && good not in parsedSchema.in
				return "Value #{good} not in the allowed list #{parsedSchema.in.join(',')}"
			
			return "#{good} <= #{parsedSchema.gte} evaluated false" if parsedSchema.gte && good <  parsedSchema.gte
			return "#{good} < #{parsedSchema.gt} evaluated false"   if parsedSchema.gt  && good <= parsedSchema.gt
			return "#{good} >= #{parsedSchema.lte} evaluated false" if parsedSchema.lte && good >  parsedSchema.lte
			return "#{good} > #{parsedSchema.lt} evaluated false"   if parsedSchema.lt  && good >= parsedSchema.lt
			return false
		
		return "#{good} is not a numbering number"

shortUuidRegex = /^[a-fA-F0-9]{32}$/
longUuidRegex  = /^[a-fA-F0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/
uuidValidator = (parsedSchema) ->
	return (good) ->
		if good == null
			return false if parsedSchema.optional
			return "null was supplied, but not allowed"
		
		if isString good
			len = good.length
			if len == 32 && shortUuidRegex.test(good)
				return false
			else if len == 36 && longUuidRegex.test(good)
				return false
		
		return "Not a uuid: #{good}"

functionValidator = (parsedSchema) ->
	return (good) ->
		if good == null
			return false if parsedSchema.optional
			return "null was supplied, but function expected"
		
		return false if isFunction(good)
		return "Not a function: #{typeof good}"



knownValueCheckers = {}
valueChecker = (schema) ->
	validator = knownValueCheckers[schema]
	
	# Cached?
	return validator if validator
	
	# Does not exist, create it
	parsedSchema = schemaParser(schema)
	
	newValidator = switch parsedSchema.type
		
		when 'anything'
			
			anythingValidator(parsedSchema)
		
		when 'boolean'
			if isDefined parsedSchema.eq
				parsedSchema.eq = switch parsedSchema.eq
					when 'true'  then true
					when 'false' then false
					else
						throw new Error("#{parsedSchema.source} has to be eq=true or eq=false")
			
			booleanValidator(parsedSchema)
		
		when 'string'
			if isDefined parsedSchema.in
				parsedSchema.in = parsedSchema.in.split(',')
			
			stringValidator(parsedSchema)
		
		when 'integer'
			
			if isDefined parsedSchema.eq
				val = parseInt(parsedSchema.eq, 10)
				if isNaN val
					throw new Error("#{parsedSchema.source} is not an integer: eq=#{parsedSchema.eq}")
				parsedSchema.eq = val
			
			if isDefined parsedSchema.in
				
				parsedSchema.in = parsedSchema.in.split(',').map (int) ->
					val = parseInt(int, 10)
					if isNaN val
						throw new Error("#{parsedSchema.source} is not a integer: in=#{parsedSchema.in}")
					return val
			
			integerValidator(parsedSchema)
		
		when 'number'
			
			if isDefined parsedSchema.eq
				val = parseFloat(parsedSchema.eq)
				if isNaN val
					throw new Error("#{parsedSchema.source} is not a number: eq=#{parsedSchema.eq}")
				parsedSchema.eq = val
			
			if isDefined parsedSchema.in
				parsedSchema.in = parsedSchema.in.split(',').map (fl) ->
					val = parseFloat(fl)
					if isNaN val
						throw new Error("#{parsedSchema.source} is not a number: in=#{parsedSchema.in}")
					return val
			
			numberValidator(parsedSchema)
		
		when 'function'
			
			functionValidator(parsedSchema)
		
		when 'uuid'
			
			uuidValidator(parsedSchema)
	
	# Cache forever
	knownValueCheckers[schema] = newValidator
	
	return newValidator

inspectForError = (schema, good) ->
	
	validator = valueChecker(schema)
	
	return validator(good)

guard = (schema, goods, parentGoods) ->
	
	if isString schema
		hasError = inspectForError(schema, goods)
		if hasError
			throw ":#{schema} " + hasError
		else
			# Schema is validated at this point
			# so it can be schema=function OR schema=... + typeof(goods)=function
			if schema == 'function' || isFunction goods
				# Since we construct our own object/array with fields,
				# the functions we assign into our structure will have a different scope
				# Therefor, when we copy over functions by reference, we need to correct their scope
				return goods.bind(parentGoods)
			
			return goods || null
	
	if isArray(schema)
		if !isArray(goods)
			throw ":Value is not an array"
		
		result = []
		
		schemaCount = schema.length
		
		if schemaCount == 0
			throw " No schema(s) defined in the array"
		
		if schemaCount == 1
			# Typical scenario, just go through it as fast as possible
			schema = schema[0]
			for good,idx in goods
				
				try
					guarded = guard(schema, good, goods)
				catch err
					throw "[#{idx}]#{err.message || err}"
				
				result.push guarded
		
		else
			goodsCount = goods.length
			
			# Abort when the number of goods are not a multiple of the schema count
			if (goodsCount % schemaCount) != 0
				throw " Values array length (#{goodsCount}) is not a multiple of the schema arraylength (#{schemaCount})"
			
			for good,idx in goods by schemaCount
				
				for i in [0..schemaCount-1]
					good = goods[idx + i]
					
					try
						guarded = guard(schema[i], good, goods)
					catch err
						throw "[#{idx+i}]#{err.message || err}"
					
					result.push guarded
		
		return result
	
	else
		if !goods
			throw ":Value is not an object"
		
		# Also handled bad input
		# luckily the for-of construct ignores values such as:
		# undefined/null/numbers/etc
		
		result = {}
		
		for own key,objSchema of schema
			
			try
				keyLen = key.length
				optional = key[keyLen - 1] == '?'
				
				if optional
					key = key.substr(0, keyLen - 1)
				
				val = goods[key]
				
				nil = val == null || val == undefined
				if nil && optional
					guarded = null
				else
					guarded = guard(objSchema, val, goods)
				
			catch err
				throw ".#{key}#{err}"
			
			result[key] = guarded
		
		return result

guardian = (input_schema, out_schema) ->
	
	if arguments.length > 2
		throw new Error("Guardian only excepts input_schema and out_schema, no further arguments. You supplied #{arguments.length}")
	
	if !input_schema && !out_schema
		throw new Error("Guardian got no schema's to validate with, pass either input or out schema, or both.")
	
	if input_schema && !isArray input_schema
		throw new Error "Guardian input schema always needs to be an array of schemas, one for each input argument. It can also be null or undefined."
	
	return (funcToWrap) ->
		if !isFunction(funcToWrap)
			throw new Error(notAFunction)
		
		return ->
			scope = this
			
			args = arguments
			
			if input_schema
				try
					result = funcToWrap.apply scope, guard(input_schema, args)
				catch err
					throw "Guarding input failed #{err.message || err}"
			else
				result = funcToWrap.apply scope, args
			
			if out_schema
				return guard(out_schema, result)
			
			return result

module.exports =
	
	inspectForError: inspectForError
	reject: (schema, goods) ->
		hasError = inspectForError(schema, goods)
		if hasError
			throw new Error hasError
		return
	
	guard: (schemas, goods) ->
		try
			guard(schemas, goods)
		catch err
			finalError = err
			if finalError[0] == '.'
				finalError = finalError.substr(1)
			
			throw new Error "Guard failed: #{finalError}"
	
	guardian: guardian
