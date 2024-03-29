const assert = require('assert');

const { isString } = require('../src/helpers');

const { inspectForError } = require('../src');

const { anything, notBoolean, notString, notInteger, notFloat, notFunction, notUuid } = require('./_generators');

const assert_inspect = function(schema, value) {
  var result;
  result = inspectForError(schema, value);
  return assert(!isString(result), `schema ${schema} should validate ${value}\n  Reason: ${result}`);
};

const assert_not_inspect = function(schema, value) {
  var result;
  result = inspectForError(schema, value);
  return assert(isString(result), `schema ${schema} allows ${value}, but that is not okay\n  Reason: ${result}`);
};

const assert_error = function(schema, errRegexp) {
  assert.throws(() => {
    return inspectForError(schema, null);
  }, errRegexp);
};

describe('inspection-special', () => {
  it('inspect checks for emails', () => {
    assert_inspect('email', 'a@b.com');
    assert_inspect('email', 'a@b.com'); // Repeated to hit cache
    assert_inspect('email?', null);
    assert_inspect('email!', 'a@b.com');
    assert_inspect('email!gte=-1&lte=10', 'a@b.com');
    assert_inspect('email!gt=-1&lt=10', 'a@b.com');
    assert_inspect('email!eq=a@b.com', 'a@b.com');
    assert_inspect('email!in=a@b.com,b@a.com', 'a@b.com');
    assert_inspect('email!in=a@b.com,b@a.com', 'b@a.com');
    assert_not_inspect('email!gte=1&lte=2', 'b@a.com');
    assert_not_inspect('email!gt=1&lt=3', 'b@a.com');
    assert_not_inspect('email!gte=1&lte=2', 'b@a.com');
    assert_not_inspect('email!gt=1&lt=3', 'b@a.com');
    assert_not_inspect('email!eq=abc', 'b@a.com');
    assert_not_inspect('email!eq=abc', '');
    assert_not_inspect('email!in=abc,def', 'b@a.com');
    assert_not_inspect('email!in=abc,def', '');
    assert_not_inspect('email!in=', 'abc');
    assert_not_inspect('email', null);
    assert_not_inspect('email!', null);
  });
  
  it('inspect checks for hex-colors', () => {
    assert_inspect('hex-color', '#abcdef');
    assert_not_inspect('hex-color!', 'b@a.com');
    assert_not_inspect('hex-color!', 123);
    assert_not_inspect('hex-color!', '#abcDE');
    assert_not_inspect('hex-color!', '#abcDEff');
  });
  it('inspect checks for jwt', () => {
    assert_inspect('jwt', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    assert_not_inspect('jwt!', 'b@a.com');
    assert_not_inspect('jwt!', 123);
    assert_not_inspect('jwt!', '#abcDE');
    assert_not_inspect('jwt!', '#abcDEff');
  });
  it('inspect checks for passwords', () => {
    assert_inspect('password', '12345678');
    assert_inspect('password', '1234567870487953049875');
    assert_inspect('password', '!#$!@#$%^#$%#$%');
    assert_inspect('password', 'abcdefghijklmnopqrstuvwxyz');
    assert_inspect('password', 'abcDEF123=-asdf');
    assert_not_inspect('password', '1234567');
  });
  it('inspect checks for timestamp-iso8601-ms', () => {
    assert_inspect('timestamp-iso8601-ms', '2021-11-03T20:16:33.000Z');
    assert_inspect('timestamp-iso8601-ms', new Date().toISOString());
    assert_not_inspect('timestamp-iso8601-ms', '2021-11-03T20:16:33');
    assert_not_inspect('timestamp-iso8601-ms', '2021-11-03T20:16:33+00:00');
    assert_not_inspect('timestamp-iso8601-ms', '2021-11-03T20:16:33Z');
  });
  it('inspect checks for bytesize', () => {
    assert_inspect('bytesize', '1');
    assert_inspect('bytesize', '1B');
    assert_inspect('bytesize', '1.44MiB');
    assert_inspect('bytesize', '10000 MB');
    assert_inspect('bytesize?', null);
    const bytesizes = [
      'B',
      'kB',
      'kilobyte',
      'MB',
      'megabyte',
      'GB',
      'gigabyte',
      'TB',
      'terabyte',
      'PB',
      'petabyte',
      'EB',
      'exabyte',
      'ZB',
      'zettabyte',
      'YB',
      'yottabyte',
      'KiB',
      'kibibyte',
      'MiB',
      'mebibyte',
      'GiB',
      'gibibyte',
      'TiB',
      'tebibyte',
      'PiB',
      'pebibyte',
      'EiB',
      'exbibyte',
      'ZiB',
      'zebibyte',
      'YiB',
      'yobibyte'
    ];
    bytesizes.forEach(function(bs) {
      assert_inspect('bytesize', '1' + bs);
    });
    assert_not_inspect('bytesize', 'abc');
    assert_not_inspect('bytesize', '');
  });
});
