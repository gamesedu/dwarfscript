let expressionParser = require('./expression-parser');
let detectType = require('./detect-type');

module.exports = function parse (code) {
  let program = {
    'log': [],
    'status': 'ok',
    'tree': [],
    'weight': 0
  };

  let recursionsCount = 0;

  // code = normalizeCode(code);

  let lines = code.split('\n');

  program.tree = clip (0, lines.length);

  function clip (start, end) {
    recursionsCount += 1;

    if (recursionsCount > 200) {
      logError(start, 'Parser error: Too many recursions');
      return [];
    }

    let tree = [];

    for (let i = start; i < end; i += 1) {
      let line = lines[i].replace(/ /g, '');

      if (line.length === 0) {
        continue;
      }

      let lineType = detectType(line);

      if (lineType.status === 'error') {
        logError(i, 'Parser error: Could not determine line type');
        return [];
      }

      lineType = lineType.type;

      if (lineType === 'closingBracket') {
        continue;
      }

      let operation = {
        'type': lineType,
        'raw': line,
        'subTree': []
      };
      let lineInfo = expressionParser[lineType](line);

      for (let key in lineInfo) {
        operation[key] = lineInfo[key];
      }

      if (lineType === 'if') {
        let endif = findClosingBracket (i, end);
        let restartAt = endif;

        if (endif === 'error') {
          logError(i, 'Parser error: could not find matching closing bracket');
          return [];
        }

        operation.subTree = clip(i + 1, endif);

        //We check the next line if there is a if
        let nextLine = lines[endif + 1];

        nextLine = nextLine.replace(/ /g, '');

        if (nextLine.match(/^else\{$/)) {
          let endelse = findClosingBracket (endif + 1, end);

          operation.elseTree = clip(endif + 2, endelse);

          restartAt = endelse;
        }

        i = restartAt;
      }

      tree.push(operation);
      program.weight += 1;
    }

    return tree;
  }

  function findClosingBracket (start, end) {
    let bracketCounter = 0;

    for (let i = start; i <= end; i += 1) {
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

    return 'error';
  }

  function logError (line, message) {
    program.log.push({
      'line': line,
      'message': message
    });
    program.status = 'error';
  }

  return program;
};

// function normalizeCode (rawCode) {
//   let normalizedCode = '';
//
//   normalizedCode = rawCode.replace(/\n\s*}\s*else\s*{\s*\n/g, '\n}\nelse {\n');
//
//   return normalizedCode;
// }
