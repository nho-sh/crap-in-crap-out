const assert = require('assert');

const  { inspectForError, guard } = require('../src');

const { notAFunction, notAGoodSchema } = require('../src/errors');

describe('input-checking', () => {
  
  // it 'guard only accepts functions', ->

  // 	badStuff = [
  // 		null
  // 		undefined
  // 		'abc'
  // 		''
  // 		[]
  // 		{}
  // 		10.0
  // 		10
  // 		false
  // 	]

  // 	badStuff.forEach (bs) ->
  // 		assert.throws ->
  // 			guard(null) bs
  // 		,
  // 			new RegExp(notAFunction)
  it('inspectForError only accepts strings as schema', () => {
    const badStuff = [null, void 0, [], {}, 10.0, 10, false];
    return badStuff.forEach(function(bs) {
      return assert.throws(() => {
        return inspectForError(bs, null);
      }, new RegExp(notAGoodSchema));
    });
  });
  it('inspectForError check for duplicate values in a field validator', () => {
    return assert.throws(() => {
      return inspectForError('number?gte=1&gte=1', null);
    }, /has this value multiple times/);
  });
  it('inspectForError check for bad numbers in a field validtor', () => {
    return assert.throws(() => {
      return inspectForError('number?gte=abc', null);
    }, /has a non-number/);
  });
  return it('inspectForError check bad validator types', () => {
    return assert.throws(() => {
      return inspectForError('numberpointnumber?', null);
    }, /Failed to parse schema/);
  });
});
