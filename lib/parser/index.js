let parseLineInfo = require('./parseLineInfo');
let detectType = require('./detectType');

module.exports = function parse (code) {
  let programTree = [];
  let programWeight = 0;
  let recursionsCount = 0;

  let lines = code.split('\n');

  programTree = clip (0, lines.length - 1);

  function clip (start, end) {
    recursionsCount += 1;

    if (recursionsCount > 200) {
      throw new Error('Parser error: Too many recursions');
    }

    let tree = [];

    for (let i = start; i < end; i += 1) {
      let line = lines[i].replace(/ /g, '');
      let lineType = detectType(line);
      let operation = {
        'type': lineType,
        'raw': line,
        'subTree': []
      };
      let lineInfo = parseLineInfo[lineType](line);

      for (let key in lineInfo) {
        operation[key] = lineInfo[key];
      }

      if (lineType === 'if') {
        let closingBracket = findClosingBracket (i);

        operation.subTree = clip(i + 1, closingBracket);
        i = closingBracket + 1;
      }

      tree.push(operation);
      programWeight += 1;
    }

    return tree;
  }

  function findClosingBracket (start) {
    let bracketCounter = 0;

    for (let i = start, len = lines.length; i < len; i += 1) {
      let line = lines[i];

      if (line.match(/\{/)) {
        bracketCounter += 1;
      }
      if (line.match(/\}/)) {
        bracketCounter -= 1;
      }
      if (bracketCounter === 0) {
        return i;
      }
    }
  }

  return programTree;
};
