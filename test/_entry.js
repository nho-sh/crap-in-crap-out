const fs = require('fs');
const path = require('path');

const testfiles = fs.readdirSync(__dirname).filter(function(file) {
  return file[0] !== '_' && file.indexOf('.js') > 0;
});

testfiles.forEach(function(f) {
  return require(__dirname + '/' + f);
});
