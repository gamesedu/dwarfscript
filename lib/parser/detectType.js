module.exports = function detectType (line) {
  let patterns = {
    'if': /^if\([a-zA-z0-9 +\-*/='\(\)]{0,}\)\{$/,
    'assign': /=/,
    'call': /\([a-zA-z0-9, +\-*/='\(\)]{0,}\)$/
  };

  for (let key in patterns) {
    if (line.match(patterns[key])) {
      return key;
    }
  }

  throw new Error(`Parser error: Could not determine type for line "${line}"`);
};
