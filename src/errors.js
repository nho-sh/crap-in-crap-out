module.exports = {
  notAFunction: 'Unable to guard, argument is not a function',
  notAGoodSchema: 'The schema provided was not a string. Only strings are accepted for schemas',
  schemaDuplicateValues: (schema, duplicateValue) => {
    return `The schema ${schema} has this value multiple times : ${duplicateValue}`;
  },
  badSchemaNumber: (schema, value) => {
    return `Schema ${schema} has a non-number : ${value}`;
  }
};
