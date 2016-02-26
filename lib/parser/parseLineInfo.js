module.exports = {
  'if': (line) => {
    let info = {};
    let paren = line.match(/\([a-zA-z0-9 +\-*/='\(\)]{0,}\)/g)[0];

    paren = paren.substring(1, paren.length - 1);

    info.condition = paren;

    return info;
  },
  'call': (line) => {
    let info = {};
    let paren = line.match(/\([a-zA-z0-9, +\-*/='\(\)]{0,}\)/g)[0];
    let methodName = line.split('(')[0];

    paren = paren.substring(1, paren.length - 1);

    info.method = methodName.split('.');
    info.arguments = [];

    if (paren.length) {
      info.arguments = paren.split(',');
    }

    return info;
  },
  'assign': (line) => {
    let info = {};
    let splitLine = line.split('=');

    info.variable = splitLine[0];
    info.value = splitLine[1];
    return info;
  }
};
