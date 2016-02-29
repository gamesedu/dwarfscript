let detectType = require('./detect-type');

let booleanOperators = {
  '==': 'equals',
  '!=': 'notequals'
};

let expressionParser = module.exports = {
  'if': (line) => {
    let info = {};
    let start = line.indexOf('(') + 1;
    let end = line.lastIndexOf(')');
    let exp = line.substring(start, end);
    //let exp = line.match(/\([a-zA-z0-9 +\-*/='\(\)]{0,}\)/g)[0];

    info.condition = expressionParser.boolean(exp);
    info.type = 'if';

    return info;
  },
  'call': (line) => {
    let info = {};
    let start = line.indexOf('(') + 1;
    let end = line.lastIndexOf(')');
    let paren = line.substring(start, end);
    //let paren = line.match(/\([a-zA-z0-9, +\-*/='\(\)]{0,}\)/g)[0];
    let methodName = line.split('(')[0];

    info.method = methodName.split('.');
    info.arguments = [];
    info.type = 'call';

    if (paren.length) {
      let args = paren.split(',');

      for (let i = 0, len = args.length; i < len; i += 1) {
        info.arguments.push(quickParse(args[i]));
      }
    }

    return info;
  },
  'assign': (line) => {
    let info = {};
    let splitLine = line.split('=');

    info.variable = splitLine[0];
    info.value = splitLine[1];
    info.type = 'assign';

    return info;
  },
  'string': (line) => {
    let info = {};
    let quotes = line.match(/'[a-zA-z0-9 +\-*/='\(\)]{0,}'/g)[0];

    info.type = 'string';
    info.value = quotes.substring(1, quotes.length - 1);

    return info;
  },
  'boolean': (line) => {
    let info = {};
    let operator = '';

    for (let key in booleanOperators) {
      if (line.match(key)) {
        operator = key;
      }
    }

    line = line.split(operator);

    info.operator = booleanOperators[operator];
    info.a = quickParse(line[0]);
    info.b = quickParse(line[1]);
    info.type = 'boolean';

    return info;
  }
};

function quickParse (exp) {
  let type = detectType(exp);

  if (type.status === 'error') {
    throw new Error(`couldnt determine type of ${exp}`);
  }

  return expressionParser[type.type](exp);
}
