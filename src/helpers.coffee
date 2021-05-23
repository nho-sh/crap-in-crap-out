module.exports =
	
	# isError: (err) ->
	# 	toString.call(err) == '[object Error]'
	
	isFunction: (fnc) ->
		typeof fnc == 'function'
	
	isString: (str) ->
		typeof str == 'string' || str instanceof String
	
	# istanbul ignore next
	isInteger: Number.isInteger || (int) ->
		# istanbul ignore next
		typeof int == 'number' &&
		isFinite(int) &&
		Math.floor(int) == int
	
	# istanbul ignore next
	isFloat: (number) ->
		typeof number == 'number' || number instanceof Number
	
	isArray: (arr) ->
		# simpler version of _.isArray
		# consider including lodash anyway
		arr && typeof arr != 'function' && typeof arr.length == 'number'
	
	isDefined: (good) ->
		good != null && good != undefined
