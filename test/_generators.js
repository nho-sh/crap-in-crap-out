/**
 * Returns all the known generators except those that are undesired
 */

const { sample } = require('./_helpers');

const getBoolean = () => {
  return Math.random() < 0.5;
};

const getFloat = () => {
  return Math.random() * 100000 - (100000 / 2);
};

const getFunction = () => {
  if (Math.random() > 0.5) {
    return () => {};
  } else {
    return new Function();
  }
};

const getInteger = () => {
  return Math.floor(getFloat());
};

const getString = () => {
  return String.fromCharCode(Math.random() * 120) + String.fromCharCode(Math.random() * 500) + String.fromCharCode(Math.random() * 12000) + String.fromCharCode(Math.random() * 50000) + String.fromCharCode(Math.random() * 80000);
};

const uuidChars = 'abcdefABCDEF1234567890';

const getOne = () => {
  return uuidChars[Math.floor(Math.random() * 22)];
};

const getUuid = () => {
  if (Math.random() > 0.5) {
    uuid = '';
    for (let i = 0; i <= 32; i++) {
      uuid += getOne();
    }
    return uuid;
  } else {
    uuid = '';
    for (let j = 0; j <= 8; j++) {
      uuid += getOne();
    }
    for (let k = 0; k <= 4; k++) {
      uuid += getOne();
    }
    for (let l = 0; l <= 4; l++) {
      uuid += getOne();
    }
    for (let m = 0; m <= 4; m++) {
      uuid += getOne();
    }
    for (let n = 0; n <= 12; n++) {
      uuid += getOne();
    }
    return uuid;
  }
};

const allGenerators = [getBoolean, getFloat, getInteger, getString, getUuid, getFunction];

const allWithout = function(undesiredGenerators) {
  return allGenerators.filter(function(gen) {
    return undesiredGenerators.indexOf(gen) === -1;
  });
};

module.exports = {
  anything: (() => {
    return () => {
      return sample(allGenerators)();
    };
  })(),
  
  /**
   * Returns any kind of data except a boolean
   */
  notBoolean: (() => {
    const notTheBools = allWithout([getBoolean]);
    
    return () => {
      return sample(notTheBools)();
    };
  })(),
  
  /**
   * Returns any kind of data except a string
   */
  notString: (() => {
    const notTheStrings = allWithout([getString, getUuid]);
    
    return () => {
      return sample(notTheStrings)();
    };
  })(),
  
  /**
   * Returns any kind of data except an integer
   */
  notInteger: (() => {
    const notTheIntegers = allWithout([getInteger]);
    
    return () => {
      return sample(notTheIntegers)();
    };
  })(),
  
  /**
   * Returns any kind of data except an integer
   */
  notFloat: (() => {
    const notTheFloats = allWithout([getInteger, getFloat]);
    
    return () => {
      return sample(notTheFloats)();
    };
  })(),
  
  /**
   * Returns any kind of data except a function
   */
  notFunction: (() => {
    const notTheFuncs = allWithout([getFunction]);
    
    return () => {
      return sample(notTheFuncs)();
    };
  })(),
  
  /**
   * Returns any kind of data except a uuid 
   */
  notUuid: (() => {
    const notTheUuids = allWithout([getUuid]);
    
    return () => {
      return sample(notTheUuids)();
    };
  })()
};
