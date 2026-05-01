const assert = require('assert');

const { toOpenAPISchema } = require('../src');

describe('toOpenAPISchema', () => {
  describe('anything (...) wildcard', () => {
    it('... converts to an empty schema (any type)', () => {
      assert.deepStrictEqual(toOpenAPISchema('...'), {
        nullable: false,
      });
    });

    it('...? converts to a nullable empty schema', () => {
      assert.deepStrictEqual(toOpenAPISchema('...?'), {
        nullable: true,
      });
    });

    it('...! converts to a non-nullable empty schema', () => {
      assert.deepStrictEqual(toOpenAPISchema('...!'), {
        nullable: false,
      });
    });
  });

  describe('boolean', () => {
    it('converts to OpenAPI boolean', () => {
      assert.deepStrictEqual(toOpenAPISchema('boolean'), {
        type: 'boolean',
        nullable: false,
      });
    });

    it('boolean? is nullable', () => {
      assert.deepStrictEqual(toOpenAPISchema('boolean?'), {
        type: 'boolean',
        nullable: true,
      });
    });

    it('boolean with eq=true/false produces enum', () => {
      assert.deepStrictEqual(toOpenAPISchema('boolean!eq=true'), {
        type: 'boolean',
        nullable: false,
        enum: [true],
      });
      assert.deepStrictEqual(toOpenAPISchema('boolean!eq=false'), {
        type: 'boolean',
        nullable: false,
        enum: [false],
      });
    });
  });

  describe('string', () => {
    it('converts string to OpenAPI string', () => {
      assert.deepStrictEqual(toOpenAPISchema('string'), {
        type: 'string',
        nullable: false,
      });
    });

    it('converts string? to a nullable string', () => {
      assert.deepStrictEqual(toOpenAPISchema('string?'), {
        type: 'string',
        nullable: true,
      });
    });

    it('string with gte / lte => minLength / maxLength', () => {
      assert.deepStrictEqual(toOpenAPISchema('string!gte=3&lte=20'), {
        type: 'string',
        nullable: false,
        minLength: 3,
        maxLength: 20,
      });
    });

    it('string with gt / lt => minLength (gt+1) / maxLength (lt-1)', () => {
      assert.deepStrictEqual(toOpenAPISchema('string!gt=2&lt=21'), {
        type: 'string',
        nullable: false,
        minLength: 3,
        maxLength: 20,
      });
    });

    it('string with len => exact minLength + maxLength', () => {
      assert.deepStrictEqual(toOpenAPISchema('string!len=8'), {
        type: 'string',
        nullable: false,
        minLength: 8,
        maxLength: 8,
      });
    });

    it('string with regex => pattern', () => {
      // Note: querystring.parse decodes '+' as a space, so avoid '+' in patterns
      // passed via the schema string. Use '{1,}' or similar alternatives.
      const result = toOpenAPISchema('string!regex=^[a-z]{3,}$');
      assert.deepStrictEqual(result, {
        type: 'string',
        nullable: false,
        pattern: '^[a-z]{3,}$',
      });
    });

    it('string with eq => single-value enum', () => {
      assert.deepStrictEqual(toOpenAPISchema('string!eq=hello'), {
        type: 'string',
        nullable: false,
        enum: ['hello'],
      });
    });

    it('string with in => multi-value enum', () => {
      assert.deepStrictEqual(toOpenAPISchema('string!in=a,b,c'), {
        type: 'string',
        nullable: false,
        enum: ['a', 'b', 'c'],
      });
    });
  });

  describe('integer', () => {
    it('converts to OpenAPI integer', () => {
      assert.deepStrictEqual(toOpenAPISchema('integer'), {
        type: 'integer',
        nullable: false,
      });
    });

    it('integer? is nullable', () => {
      assert.deepStrictEqual(toOpenAPISchema('integer?'), {
        type: 'integer',
        nullable: true,
      });
    });

    it('integer with gte / lte => minimum / maximum', () => {
      assert.deepStrictEqual(toOpenAPISchema('integer!gte=0&lte=100'), {
        type: 'integer',
        nullable: false,
        minimum: 0,
        maximum: 100,
      });
    });

    it('integer with gt / lt => exclusiveMinimum / exclusiveMaximum', () => {
      assert.deepStrictEqual(toOpenAPISchema('integer!gt=0&lt=100'), {
        type: 'integer',
        nullable: false,
        exclusiveMinimum: 0,
        exclusiveMaximum: 100,
      });
    });

    it('integer with eq => single-value enum (coerced to number)', () => {
      assert.deepStrictEqual(toOpenAPISchema('integer!eq=42'), {
        type: 'integer',
        nullable: false,
        enum: [42],
      });
    });

    it('integer with in => multi-value enum (coerced to numbers)', () => {
      assert.deepStrictEqual(toOpenAPISchema('integer!in=1,2,3'), {
        type: 'integer',
        nullable: false,
        enum: [1, 2, 3],
      });
    });
  });

  describe('number', () => {
    it('converts to OpenAPI number', () => {
      assert.deepStrictEqual(toOpenAPISchema('number'), {
        type: 'number',
        nullable: false,
      });
    });

    it('number? is nullable', () => {
      assert.deepStrictEqual(toOpenAPISchema('number?'), {
        type: 'number',
        nullable: true,
      });
    });

    it('number with gte / lte => minimum / maximum', () => {
      assert.deepStrictEqual(toOpenAPISchema('number!gte=1.5&lte=9.9'), {
        type: 'number',
        nullable: false,
        minimum: 1.5,
        maximum: 9.9,
      });
    });

    it('number with gt / lt => exclusiveMinimum / exclusiveMaximum', () => {
      assert.deepStrictEqual(toOpenAPISchema('number!gt=0&lt=1'), {
        type: 'number',
        nullable: false,
        exclusiveMinimum: 0,
        exclusiveMaximum: 1,
      });
    });

    it('number with eq => single-value enum (coerced to float)', () => {
      assert.deepStrictEqual(toOpenAPISchema('number!eq=3.14'), {
        type: 'number',
        nullable: false,
        enum: [3.14],
      });
    });

    it('number with in => multi-value enum (coerced to floats)', () => {
      assert.deepStrictEqual(toOpenAPISchema('number!in=1.1,2.2,3.3'), {
        type: 'number',
        nullable: false,
        enum: [1.1, 2.2, 3.3],
      });
    });
  });

  describe('uuid', () => {
    it('converts to string with format uuid', () => {
      assert.deepStrictEqual(toOpenAPISchema('uuid'), {
        type: 'string',
        nullable: false,
        format: 'uuid',
      });
    });

    it('uuid? is nullable', () => {
      assert.deepStrictEqual(toOpenAPISchema('uuid?'), {
        type: 'string',
        nullable: true,
        format: 'uuid',
      });
    });
  });

  describe('email', () => {
    it('converts to string with format email (no redundant pattern)', () => {
      assert.deepStrictEqual(toOpenAPISchema('email'), {
        type: 'string',
        nullable: false,
        format: 'email',
      });
    });

    it('email? is nullable', () => {
      assert.deepStrictEqual(toOpenAPISchema('email?'), {
        type: 'string',
        format: 'email',
        nullable: true,
      });
    });
  });

  describe('hex-color', () => {
    it('converts to string with pattern', () => {
      assert.deepStrictEqual(toOpenAPISchema('hex-color'), {
        type: 'string',
        nullable: false,
        pattern: '^#[A-Fa-f0-9]{6}$',
      });
    });

    it('hex-color? is nullable', () => {
      assert.deepStrictEqual(toOpenAPISchema('hex-color?'), {
        type: 'string',
        nullable: true,
        pattern: '^#[A-Fa-f0-9]{6}$',
      });
    });
  });

  describe('jwt', () => {
    it('converts to string type', () => {
      assert.deepStrictEqual(toOpenAPISchema('jwt'), {
        type: 'string',
        nullable: false,
        pattern: '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*$',
      });
    });

    it('jwt? is nullable', () => {
      const result = toOpenAPISchema('jwt?');
      assert.deepStrictEqual(result, {
        type: 'string',
        nullable: true,
        pattern: '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*$',
      });
    });
  });

  describe('timestamp-iso8601-ms', () => {
    it('converts to string with date-time format (no redundant pattern/length)', () => {
      assert.deepStrictEqual(toOpenAPISchema('timestamp-iso8601-ms'), {
        type: 'string',
        nullable: false,
        format: 'date-time',
        pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$',
      });
    });

    it('timestamp-iso8601-ms? is nullable', () => {
      assert.deepStrictEqual(toOpenAPISchema('timestamp-iso8601-ms?'), {
        type: 'string',
        nullable: true,
        format: 'date-time',
        pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$',
      });
    });
  });

  describe('bytesize', () => {
    it('converts to string type', () => {
      assert.deepStrictEqual(toOpenAPISchema('bytesize'), {
        type: 'string',
        nullable: false,
        pattern:
          '^[0-9]+(\\.[0-9]+)?(\\s*(B|kB|kilobyte|MB|megabyte|GB|gigabyte|TB|terabyte|PB|petabyte|EB|exabyte|ZB|zettabyte|YB|yottabyte|KiB|kibibyte|MiB|mebibyte|GiB|gibibyte|TiB|tebibyte|PiB|pebibyte|EiB|exbibyte|ZiB|zebibyte|YiB|yobibyte))?$',
      });
    });

    it('bytesize? is nullable', () => {
      const result = toOpenAPISchema('bytesize?');
      assert.deepStrictEqual(result, {
        type: 'string',
        nullable: true,
        pattern:
          '^[0-9]+(\\.[0-9]+)?(\\s*(B|kB|kilobyte|MB|megabyte|GB|gigabyte|TB|terabyte|PB|petabyte|EB|exabyte|ZB|zettabyte|YB|yottabyte|KiB|kibibyte|MiB|mebibyte|GiB|gibibyte|TiB|tebibyte|PiB|pebibyte|EiB|exbibyte|ZiB|zebibyte|YiB|yobibyte))?$',
      });
    });
  });

  describe('null', () => {
    it('converts to null type', () => {
      assert.deepStrictEqual(toOpenAPISchema('null'), {
        type: 'null',
        nullable: false,
      });
    });
  });

  describe('function', () => {
    it('returns null (no JSON Schema equivalent)', () => {
      assert.deepStrictEqual(toOpenAPISchema('function'), null);
    });
  });

  describe('object schema', () => {
    it('converts a simple flat object', () => {
      const schema = {
        name: 'string',
        age: 'integer',
      };
      assert.deepStrictEqual(toOpenAPISchema(schema), {
        type: 'object',
        required: ['name', 'age'],
        additionalProperties: false,
        properties: {
          name: {
            type: 'string',
            nullable: false,
          },
          age: {
            type: 'integer',
            nullable: false,
          },
        },
      });
    });

    it('optional keys (key?) are excluded from required', () => {
      const schema = {
        id: 'uuid',
        'nickname?': 'string',
      };
      assert.deepStrictEqual(toOpenAPISchema(schema), {
        type: 'object',
        required: ['id'],
        additionalProperties: false,
        properties: {
          id: {
            type: 'string',
            nullable: false,
            format: 'uuid',
          },
          nickname: {
            type: 'string',
            nullable: false,
          },
        },
      });
    });

    it('object with all optional keys has no required array', () => {
      const schema = {
        'a?': 'string',
        'b?': 'integer',
      };
      const result = toOpenAPISchema(schema);
      assert.deepStrictEqual(result, {
        type: 'object',
        // required: undefined,
        properties: {
          a: {
            type: 'string',
            nullable: false,
          },
          b: {
            type: 'integer',
            nullable: false,
          },
        },
        additionalProperties: false,
      });
    });

    it('function-typed properties are omitted from the output', () => {
      const schema = {
        id: 'uuid',
        handler: 'function',
      };
      const result = toOpenAPISchema(schema);
      assert.deepStrictEqual(Object.keys(result.properties), ['id']);
      assert.deepStrictEqual(result.required, ['id']);
    });

    it('converts a nested object schema', () => {
      const schema = {
        user: {
          id: 'uuid',
          email: 'email',
        },
      };
      const result = toOpenAPISchema(schema);
      assert.deepStrictEqual(result.properties.user, {
        type: 'object',
        required: ['id', 'email'],
        additionalProperties: false,
        properties: {
          id: {
            type: 'string',
            nullable: false,
            format: 'uuid',
          },
          email: {
            type: 'string',
            nullable: false,
            format: 'email',
          },
        },
      });
    });

    it('full example: mixed types and optional keys', () => {
      const schema = {
        id: 'uuid!',
        email: 'email!',
        'nickname?': 'string?&gte=3&lte=20',
        score: 'integer!&gte=0&lte=100',
        tags: ['string!'],
      };

      assert.deepStrictEqual(toOpenAPISchema(schema), {
        type: 'object',
        required: ['id', 'email', 'score', 'tags'],
        additionalProperties: false,
        properties: {
          id: {
            type: 'string',
            nullable: false,
            format: 'uuid',
          },
          email: {
            type: 'string',
            nullable: false,
            format: 'email',
          },
          nickname: {
            type: 'string',
            nullable: true,
            minLength: 3,
            maxLength: 20,
          },
          score: {
            type: 'integer',
            nullable: false,
            minimum: 0,
            maximum: 100,
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
              nullable: false,
            },
          },
        },
      });
    });
  });

  describe('array schema', () => {
    it('converts a primitive array', () => {
      assert.deepStrictEqual(toOpenAPISchema(['string']), {
        type: 'array',
        items: {
          type: 'string',
          nullable: false,
        },
      });
    });

    it('converts an array of objects', () => {
      assert.deepStrictEqual(
        toOpenAPISchema([{ id: 'uuid', name: 'string' }]),
        {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'name'],
            additionalProperties: false,
            properties: {
              id: {
                type: 'string',
                nullable: false,
                format: 'uuid',
              },
              name: {
                type: 'string',
                nullable: false,
              },
            },
          },
        }
      );
    });

    it('throws when the array schema has no elements', () => {
      assert.throws(
        () => toOpenAPISchema([]),
        /Array schema must contain exactly one element schema/
      );
    });

    it('throws when the array schema has more than one element', () => {
      assert.throws(
        () => toOpenAPISchema(['string', 'integer']),
        /Array schema must contain exactly one element schema/
      );
    });
  });

  describe('invalid schema input', () => {
    it('throws for null schema', () => {
      assert.throws(() => toOpenAPISchema(null), /Invalid schema value/);
    });

    it('throws for a numeric schema', () => {
      assert.throws(() => toOpenAPISchema(42), /Invalid schema value/);
    });

    it('throws for an unknown string type', () => {
      assert.throws(
        () => toOpenAPISchema('notAType'),
        /Failed to parse schema notAType/
      );
    });
  });
});
