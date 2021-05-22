{ sample } = require './_helpers'

getBoolean = ->
	Math.random() < 0.5

getFloat = ->
	Math.random() * 100000 - (100000/2)

getFunction = ->
	if Math.random() > 0.5
		return ->
	else
		new Function()

getInteger = ->
	Math.floor(getFloat())

getString = ->
	String.fromCharCode(Math.random() * 120) +
	String.fromCharCode(Math.random() * 500) +
	String.fromCharCode(Math.random() * 12000) +
	String.fromCharCode(Math.random() * 50000) +
	String.fromCharCode(Math.random() * 80000)

uuidChars = 'abcdefABCDEF1234567890'
getOne = -> uuidChars[(Math.floor Math.random() * 22)]
getUuid = ->
	if Math.random() > 0.5
		uuid = ''
		uuid += getOne() for [0..32]
		return uuid
	else
		uuid = ''
		uuid += getOne() for [0..8]
		uuid += getOne() for [0..4]
		uuid += getOne() for [0..4]
		uuid += getOne() for [0..4]
		uuid += getOne() for [0..12]
		return uuid

allGenerators = [
	getBoolean
	getFloat
	getInteger
	getString
	getUuid
	getFunction
]

###*
 * Returns all the known generators except those that are undesired
###
allWithout = (undesiredGenerators) ->
	allGenerators.filter (gen) ->
		undesiredGenerators.indexOf(gen) == -1

module.exports =
	
	anything: do ->
		return ->
			return sample(allGenerators)()
	
	###*
	 * Returns any kind of data except a boolean
	###
	notBoolean: do ->
		notTheBools = allWithout([ getBoolean ])
		return ->
			return sample(notTheBools)()
	
	###*
	 * Returns any kind of data except a string
	###
	notString: do ->
		notTheStrings = allWithout([ getString, getUuid ])
		return ->
			return sample(notTheStrings)()
	
	###*
	 * Returns any kind of data except an integer
	###
	notInteger: do ->
		notTheIntegers = allWithout([ getInteger ])
		return ->
			return sample(notTheIntegers)()
	
	###*
	 * Returns any kind of data except an integer
	###
	notFloat: do ->
		notTheFloats = allWithout([ getInteger, getFloat ])
		return ->
			return sample(notTheFloats)()
	
	###*
	 * Returns any kind of data except a function
	###
	notFunction: do ->
		notTheFuncs = allWithout([ getFunction ])
		return ->
			return sample(notTheFuncs)()
	
	###*
	 * Returns any kind of data except a uuid 
	###
	notUuid: do ->
		notTheUuids = allWithout([ getUuid ])
		return ->
			return sample(notTheUuids)()
