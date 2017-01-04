(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Application = require('./lib/index');
var application = new Application();

application.view.on('render', function run() {
  application.run();
});
document.body.appendChild(application.view.render().el);

},{"./lib/index":4}],2:[function(require,module,exports){
'use strict';

var relative = {
  'ahead': 0,
  'right': 1,
  'behind': 2,
  'left': -1
};
var absolute = ['north', 'west', 'south', 'east'];

module.exports = {
  'absolute': absolute,
  'relative': relative,
  'getAbsoluteFromTurn': function getAbsoluteFromTurn(currentDirection, turn) {
    var dir = absolute.indexOf(currentDirection);
    var clock = {
      'clock': 1,
      'right': 1,
      'counter': -1,
      'left': -1
    };

    dir = ((dir + clock[turn]) % absolute.length + absolute.length) % absolute.length;

    return absolute[dir];
  },
  'getAbsoluteFromRelative': function getAbsoluteFromRelative(currentDirection, rel) {
    var dir = absolute.indexOf(currentDirection);

    if (!relative.hasOwnProperty(rel)) {
      return rel;
    }

    dir = ((dir + relative[rel]) % absolute.length + absolute.length) % absolute.length;

    return absolute[dir];
  },
  'getNextTileCoordinates': function getNextTileCoordinates(coordinates, direction) {
    var x = coordinates.x;
    var y = coordinates.y;
    var movement = {
      'north': function north() {
        y -= 1;
      },
      'west': function west() {
        x += 1;
      },
      'south': function south() {
        y += 1;
      },
      'east': function east() {
        x -= 1;
      }
    };

    movement[direction]();

    return { 'x': x, 'y': y };
  }
};

},{}],3:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * helper
 */
var matchAncestorOf = function matchAncestorOf(child, parentSelector, stopAtElement) {
  if (!parentSelector) {
    return stopAtElement;
  }

  if (!child || child === stopAtElement) {
    return false;
  }

  if (child.matches(parentSelector)) {
    return child;
  }

  return matchAncestorOf(child.parentElement, parentSelector, stopAtElement);
};

/**
 * @class DomDelegate
 */
module.exports = function () {
  /**
   * constructor
   *
   * @param {Element} root - root element which will be actually bound
   */
  function DomDelegate(root) {
    _classCallCheck(this, DomDelegate);

    if (!root) {
      throw new Error('Missing `root` argument');
    }

    this.root = root;
    this.events = {};
  }

  //The callback has the follow signature:
  //
  //```
  //function callback(domNativeEvent, extraData)
  //
  //extraData = {
  //  'matchedTarget': HTMLElement // this is the element which matches given selector
  //}
  //```
  /**
   * add listener
   *
   * @param {String} event
   * @param {String} selector
   * @param {Function} callback
   * @param {*} [context]
   * @return {DomDelegate}
   */


  _createClass(DomDelegate, [{
    key: 'on',
    value: function on(event, selector, callback, context) {
      var _this = this;

      if (typeof selector === 'function') {
        context = callback;
        callback = selector;
        selector = '';
      }

      if (!callback) {
        throw new Error('Missing `callback` argument');
      }

      selector = selector || '';
      context = context || null;

      var callbacks = this.events[event];

      //We add only one listener per event and then look for matching delegation later
      if (!callbacks) {
        callbacks = this.events[event] = [];

        var delegate = this.events[event].delegationCallback = function (e) {
          _this.events[event].filter(function (scope) {
            return !scope.selector && e.target === _this.root || matchAncestorOf(e.target, scope.selector, _this.root);
          }).forEach(function (scope) {
            var matchedTarget = scope.selector === '' && _this.root || matchAncestorOf(e.target, scope.selector, _this.root);

            if (scope.context) {
              return scope.callback.call(scope.context, e, { 'matchedTarget': matchedTarget });
            }

            scope.callback(e, { 'matchedTarget': matchedTarget });
          });
        };

        this.root.addEventListener(event, delegate, true);
      }

      callbacks.push({
        'selector': selector,
        'callback': callback,
        'context': context
      });

      return this;
    }

    /**
     * remove event listener
     *
     * @param {String} [event]
     * @param {String} [selector]
     * @param {Function} [callback]
     * @param {*} [context]
     * @return {DomDelegate}
     */
    /*eslint complexity: [2, 20]*/

  }, {
    key: 'off',
    value: function off(event, selector, callback, context) {
      var arity = arguments.length;

      if (typeof selector === 'function') {
        context = callback;
        callback = selector;
        selector = '';
      }

      selector = selector || '';
      context = context || null;

      if (arity === 0) {
        for (event in this.events) {
          this.root.removeEventListener(event, this.events[event].delegationCallback, true);
        }

        this.events = {};

        return this;
      }

      if (!this.events[event]) {
        return this;
      }

      if (arity === 1) {
        this.root.removeEventListener(event, this.events[event].delegationCallback, true);

        delete this.events[event];

        return this;
      }

      var delegationCallback = this.events[event].delegationCallback;

      this.events[event] = this.events[event].filter(function (scope) {
        return !(arity === 2 && scope.selector === selector || arity === 3 && scope.selector === selector && scope.callback === callback || arity === 4 && scope.selector === selector && scope.callback === callback && scope.context === context);
      });
      this.events[event].delegationCallback = delegationCallback;

      if (!this.events[event].length) {
        this.root.removeEventListener(event, this.events[event].delegationCallback, true);

        delete this.events[event];
      }

      return this;
    }

    /**
     * destructor
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.off();

      this.root = null;
      this.events = null;
    }
  }]);

  return DomDelegate;
}();

},{}],4:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MainView = require('./views/main-view');
var Unit = require('./unit');
var parse = require('./parser');

var maps = require('./maps');

module.exports = function () {
  function Application() {
    _classCallCheck(this, Application);

    this.view = new MainView({
      'map': maps[0]
    });
    this.dwarf = new Unit({
      'type': 'dwarf',
      'name': 'Gimlet',
      'modules': ['legs', 'sensor'],
      'map': this.view.map
    });

    this.view.on('program.run', this.onProgramRun.bind(this));
    this.view.on('game.victory', this.onVictory.bind(this));
    this.dwarf.on('unit.move', this.onUnitMove.bind(this));
  }

  _createClass(Application, [{
    key: 'run',
    value: function run() {
      this.dwarf.position = { 'x': 1, 'y': 2 };
      this.view.map.drawUnit(this.dwarf);
    }
  }, {
    key: 'onProgramRun',
    value: function onProgramRun(e, code) {
      if (this.dwarf.processor.running) {
        this.dwarf.processor.running = false;
        this.view.runButton.innerHTML = 'RUN';
        this.view.runButton.classList.remove('ds-execution-stop');
        return;
      }

      var program = parse(code);

      if (program.status === 'ok') {
        this.dwarf.run(program.tree);
        this.view.runButton.innerHTML = 'STOP';
        this.view.runButton.classList.add('ds-execution-stop');
      }
      this.view.renderParsingLog(program.log);
    }
  }, {
    key: 'onVictory',
    value: function onVictory() {
      /* eslint-disable no-alert */
      this.onProgramRun();
      alert('Wow congrats you won !!');
    }
  }, {
    key: 'onUnitMove',
    value: function onUnitMove(e, unit, coordinates) {
      this.view.map.moveUnit(unit, coordinates);
    }
  }]);

  return Application;
}();

},{"./maps":5,"./parser":8,"./unit":9,"./views/main-view":15}],5:[function(require,module,exports){
"use strict";

module.exports = ["\nWWWWWWWWWWWWWWW\nW_W_____W____WW\nW_W_W_W___WW__W\nW___W_WWWWWWW_W\nWWWWW__WW___W_W\nW___WW_W__W___W\nW_W____W_WWWWWW\nW_WWWWWW______W\nW__W_____WWWW_W\nW_WWWWWW___W__W\nW_W____WWWWW_WW\nW_W_WW_W___W__W\nW_W_WWWW_W_WW_W\nW____WV__W____W\nWWWWWWWWWWWWWWW\n", "ABBBBBBBBBBBC\nDEEEEEEEEEEEF\nG___________I\nG___MN______I\nG___OP______I\nG___QR______I\nG___ST______I\nG___________I\nG_______MN__I\nG_______IG__I\nJKKKKKKKVUKKL"];

},{}],6:[function(require,module,exports){
'use strict';

module.exports = function detectType(line) {
  var patterns = {
    'if': /^if\([a-zA-z0-9 .+\-*/!='\(\)]{0,}\)\{$/,
    'assign': /=/,
    'call': /\([a-zA-z0-9, +\-*/='\(\)]{0,}\)$/,
    'closingBracket': /^}$/,
    'string': /'[a-zA-z0-9, +\-*/='\(\)]{0,}'/
  };

  for (var key in patterns) {
    if (line.match(patterns[key])) {
      return { 'type': key, 'status': 'ok' };
    }
  }

  return { 'type': 'unknown', 'status': 'error' };
};

},{}],7:[function(require,module,exports){
'use strict';

var detectType = require('./detect-type');

var booleanOperators = {
  '==': 'equals',
  '!=': 'notequals'
};

var expressionParser = module.exports = {
  'if': function _if(line) {
    var info = {};
    var start = line.indexOf('(') + 1;
    var end = line.lastIndexOf(')');
    var exp = line.substring(start, end);
    //let exp = line.match(/\([a-zA-z0-9 +\-*/='\(\)]{0,}\)/g)[0];

    info.condition = expressionParser.boolean(exp);
    info.type = 'if';

    return info;
  },
  'call': function call(line) {
    var info = {};
    var start = line.indexOf('(') + 1;
    var end = line.lastIndexOf(')');
    var paren = line.substring(start, end);
    //let paren = line.match(/\([a-zA-z0-9, +\-*/='\(\)]{0,}\)/g)[0];
    var methodName = line.split('(')[0];

    info.method = methodName.split('.');
    info.arguments = [];
    info.type = 'call';

    if (paren.length) {
      var args = paren.split(',');

      for (var i = 0, len = args.length; i < len; i += 1) {
        info.arguments.push(quickParse(args[i]));
      }
    }

    return info;
  },
  'assign': function assign(line) {
    var info = {};
    var splitLine = line.split('=');

    info.variable = splitLine[0];
    info.value = splitLine[1];
    info.type = 'assign';

    return info;
  },
  'string': function string(line) {
    var info = {};
    var quotes = line.match(/'[a-zA-z0-9 +\-*/='\(\)]{0,}'/g)[0];

    info.type = 'string';
    info.value = quotes.substring(1, quotes.length - 1);

    return info;
  },
  'boolean': function boolean(line) {
    var info = {};
    var operator = '';

    for (var key in booleanOperators) {
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

function quickParse(exp) {
  var type = detectType(exp);

  if (type.status === 'error') {
    throw new Error('couldnt determine type of ' + exp);
  }

  return expressionParser[type.type](exp);
}

},{"./detect-type":6}],8:[function(require,module,exports){
'use strict';

var expressionParser = require('./expression-parser');
var detectType = require('./detect-type');

module.exports = function parse(code) {
  var program = {
    'log': [],
    'status': 'ok',
    'tree': [],
    'weight': 0
  };

  var recursionsCount = 0;

  // code = normalizeCode(code);

  var lines = code.split('\n');

  program.tree = clip(0, lines.length);

  function clip(start, end) {
    recursionsCount += 1;

    if (recursionsCount > 200) {
      logError(start, 'Parser error: Too many recursions');
      return [];
    }

    var tree = [];

    for (var i = start; i < end; i += 1) {
      var line = lines[i].replace(/ /g, '');

      if (line.length === 0) {
        continue;
      }

      var lineType = detectType(line);

      if (lineType.status === 'error') {
        logError(i, 'Parser error: Could not determine line type');
        return [];
      }

      lineType = lineType.type;

      if (lineType === 'closingBracket') {
        continue;
      }

      var operation = {
        'type': lineType,
        'raw': line,
        'subTree': []
      };
      var lineInfo = expressionParser[lineType](line);

      for (var key in lineInfo) {
        operation[key] = lineInfo[key];
      }

      if (lineType === 'if') {
        var endif = findClosingBracket(i, end);
        var restartAt = endif;

        if (endif === 'error') {
          logError(i, 'Parser error: could not find matching closing bracket');
          return [];
        }

        operation.subTree = clip(i + 1, endif);

        //We check the next line if there is a if
        var nextLine = lines[endif + 1];

        nextLine = nextLine.replace(/ /g, '');

        if (nextLine.match(/^else\{$/)) {
          var endelse = findClosingBracket(endif + 1, end);

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

  function findClosingBracket(start, end) {
    var bracketCounter = 0;

    for (var i = start; i <= end; i += 1) {
      var line = lines[i];

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

  function logError(line, message) {
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

},{"./detect-type":6,"./expression-parser":7}],9:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }


var path = require('path');
var template = require('ak-template');
var defaults = require('stluafed');

var View = require('../view');
var Processor = require('./processor');

var modules = require('./modules');

// http://spritespace.blogspot.fr/2013/10/to-start-of-with-here-are-collection-of.html
// http://game-icons.net/
// http://opengameart.org/sites/default/files/dungeon_pre.png + http://opengameart.org/sites/default/files/dungeon_tiles_2.png
// http://opengameart.org/content/a-blocky-dungeon

module.exports = function (_View) {
  _inherits(Unit, _View);

  function Unit() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Unit);

    var _this = _possibleConstructorReturn(this, (Unit.__proto__ || Object.getPrototypeOf(Unit)).call(this, options));

    _this.template = template("<div class=\"ds-unit ds-unit-<%- locals.type %> ds-direction-<%- locals.direction %>\" title=\"<%- locals.name %>\">\n<div>\n");
    _this.options = defaults(options, {
      'events': [],
      'type': 'robot',
      'name': 'anonymous',
      'direction': 'west',
      'fuel': 10,
      'modules': ['wheels']
    });

    _this.map = options.map;
    _this.programContext = {};
    _this.processor = new Processor({
      'parent': _this
    });

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = _this.options.modules[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var moduleName = _step.value;

        _this.addModule(moduleName);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return _this;
  }

  _createClass(Unit, [{
    key: 'run',
    value: function run(program) {
      this.processor.run(program);
    }
  }, {
    key: 'render',
    value: function render() {
      this.emit('rendering');
      this.renderTemplate(this.options);
      this.emit('render');

      return this;
    }
  }, {
    key: 'addModule',
    value: function addModule(module) {
      if (!modules[module]) {
        throw new Error('Could not find module "' + module + '"');
      }

      this[module] = modules[module](this);
    }
  }, {
    key: 'useFuel',
    value: function useFuel() {
      var amt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

      if (this.type === 'robot') {
        this.fuel -= amt;
      }
    }
  }, {
    key: 'fuel',
    get: function get() {
      return this.options.fuel;
    }
  }, {
    key: 'direction',
    set: function set(direction) {
      this.options.direction = direction;
    },
    get: function get() {
      return this.options.direction;
    }
  }, {
    key: 'name',
    set: function set(name) {
      throw new Error('Attempting to assign ' + name + ' to name which is a read only property');
    },
    get: function get() {
      return this.options.name;
    }
  }, {
    key: 'type',
    set: function set(type) {
      throw new Error('Attempting to assign ' + type + ' to type which is a read only property');
    },
    get: function get() {
      return this.options.type;
    }
  }]);

  return Unit;
}(View);

},{"../view":14,"./modules":10,"./processor":13,"ak-template":19,"path":22,"stluafed":24}],10:[function(require,module,exports){
'use strict';

module.exports = {
  'legs': require('./wheels'),
  'wheels': require('./wheels'),
  'sensor': require('./sensor')
};

},{"./sensor":11,"./wheels":12}],11:[function(require,module,exports){
'use strict';

var directions = require('../../directions');

module.exports = function sensor(parent) {
  //let scanRange = 1;
  var _info = {
    'general': {
      'status': 'ok'
    },
    'scan': {
      'duration': 20
    }
  };

  return {
    'info': function info(infoName) {
      return _info[infoName];
    },
    'scan': function scan() {
      var direction = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'ahead';

      var absoluteDirection = directions.getAbsoluteFromRelative(parent.direction, direction);
      var lookAt = directions.getNextTileCoordinates(parent.position, absoluteDirection);
      var tile = parent.map.selectTile(lookAt);

      if (!tile || tile.type === 'wall') {
        return 'obstacle';
      }

      return 'clear';
    }
  };
};

},{"../../directions":2}],12:[function(require,module,exports){
'use strict';

var directions = require('../../directions');

module.exports = function wheels(parent) {
  var _info = {
    'general': {
      'status': 'ok'
    },
    'turn': {
      'duration': 150
    },
    'forward': {
      'duration': 300
    }
  };

  return {
    'info': function info(infoName) {
      return _info[infoName];
    },
    'turn': function turn() {
      var direction = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'clock';

      for (var i = 0, len = directions.absolute.length; i < len; i += 1) {
        parent.el.classList.remove('ds-direction-' + directions.absolute[i]);
      }

      parent.direction = directions.getAbsoluteFromTurn(parent.direction, direction);
      parent.el.classList.add('ds-direction-' + parent.direction);

      return parent;
    },
    'forward': function forward() {
      var newCoordinates = directions.getNextTileCoordinates(parent.position, parent.direction);

      if (parent.fuel <= 0) {
        parent.log(parent.name + ' the ' + parent.type + ' has no more fuel.');
        return;
      }

      parent.useFuel();
      parent.emit('unit.move', parent, newCoordinates);
    }
  };
};

},{"../../directions":2}],13:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function () {
  function Processor() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Processor);

    this.parent = options.parent;
    this.executionLog = [];
  }

  _createClass(Processor, [{
    key: 'run',
    value: function run(program) {
      var _this = this;

      var i = 0;

      if (!this.running) {
        this.running = true;

        this.log('Program starting from the top');

        this.nextLine(program, i, function () {
          _this.running = false;
          _this.run(program);
        });
      }
    }
  }, {
    key: 'nextLine',
    value: function nextLine(program, i, callback) {
      if (!this.running) {
        return;
      }

      var line = program[i];
      var lineType = line.type;
      var last = i + 1 === program.length;

      var nextContent = this.nextLine.bind(this, program, i + 1, callback);

      if (last) {
        nextContent = callback;
      }

      var next = function next() {
        var delay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

        setTimeout(function exec() {
          nextContent();
        }, delay);
      };

      if (lineType === 'assign') {
        //this[program[i]] && this[program[i]]();
        next();
      }
      if (lineType === 'if') {
        if (this.testCondition(line.condition)) {
          this.nextLine(line.subTree, 0, next);
        } else if (line.elseTree) {
          this.nextLine(line.elseTree, 0, next);
        } else {
          next();
        }
      }
      if (lineType === 'call') {
        var methodInfo = this.execCall(program[i]);

        next(methodInfo.info.duration);
      }
    }
  }, {
    key: 'execCall',
    value: function execCall(call) {
      var methodPath = call.method;
      var methodInfo = {};
      var methodContext = 'programContext';
      var methodName = '';
      var parameters = [];

      if (methodPath.length === 1) {
        methodName = methodPath[0];
      }
      if (methodPath.length === 2) {
        methodContext = methodPath[0];
        methodName = methodPath[1];
      }

      if (!this.parent[methodContext] || !this.parent[methodContext][methodName]) {
        throw new Error(this.parent.name + ' the ' + this.parent.type + ' cannot run "' + methodPath.join('.') + '(' + parameters + ')"');
      }

      for (var i = 0, len = call.arguments.length; i < len; i += 1) {
        parameters.push(this.getArgumentValue(call.arguments[i]));
      }

      //get info from module
      methodInfo = this.parent[methodContext].info && this.parent[methodContext].info(methodName);

      return {
        'return': this.parent[methodContext][methodName].apply(this.parent, parameters),
        'info': methodInfo
      };
    }
  }, {
    key: 'testCondition',
    value: function testCondition(condition) {
      if (condition.operator === 'equals') {
        return this.getArgumentValue(condition.a) === this.getArgumentValue(condition.b);
      }
      if (condition.operator === 'notequals') {
        return this.getArgumentValue(condition.a) !== this.getArgumentValue(condition.b);
      }
      return false;
    }
  }, {
    key: 'getArgumentValue',
    value: function getArgumentValue(arg) {
      if (arg.type === 'string') {
        return arg.value;
      }
      if (arg.type === 'call') {
        var value = this.execCall(arg);

        return value.return;
      }

      return false;
    }
  }, {
    key: 'log',
    value: function log(text) {
      /* eslint-disable no-console */
      console.log(text);
      this.executionLog.push(text);
    }
  }]);

  return Processor;
}();

},{}],14:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('ak-eventemitter');
var DomDelegate = require('./dom-delegate');

module.exports = function (_EventEmitter) {
  _inherits(View, _EventEmitter);

  function View() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, View);

    var _this = _possibleConstructorReturn(this, (View.__proto__ || Object.getPrototypeOf(View)).call(this, options));

    _this.events = {};
    _this.element = null;
    _this.delegate = null;
    _this.options = options;
    return _this;
  }

  /**
   * view's main DOM element
   *
   * @return {Element}
   */


  _createClass(View, [{
    key: 'bind',


    /**
     * bind events to the view's main DOM element
     *
     * @throws Error - if view has not been rendered
     *
     * @param {Array<ViewEvent>} [events]
     * @return {View}
     */
    value: function bind() {
      var events = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.options.events;

      if (!this.element) {
        throw new Error('View has not been rendered yet.');
      }

      if (!events) {
        return this;
      }

      //Will try to unbind events first, to avoid duplicates
      this.unbind(events);
      this.handleEvents('on', events);

      return this;
    }

    /**
     * unbind events from the view's main DOM element
     *
     * @throws Error - if view has not been rendered
     *
     * @param {Array<ViewEvent>} [events]
     * @return {View}
     */

  }, {
    key: 'unbind',
    value: function unbind() {
      var events = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.options.events;

      if (!this.element) {
        throw new Error('View has not been rendered yet.');
      }

      if (!events) {
        this.delegate.off();

        return this;
      }

      this.handleEvents('off', events);

      return this;
    }

    /**
     * Template rendering
     *
     * @param  {Object} data - data to display
     * @return {WidgetView}
     */

  }, {
    key: 'renderTemplate',
    value: function renderTemplate(data) {
      //Will always unbind before rendering if main element is already set.
      if (this.element) {
        this.unbind();
        this.delegate.destroy();
      }

      if (!this.template) {
        throw new Error('Missing `this.template`');
      }

      //Only takes the first child element of the template.
      this.element = this.domify(this.template(data || {}));
      this.delegate = new DomDelegate(this.element);

      this.bind();

      return this;
    }

    /**
     * render the template (proxy for `#renderTemplate()`)
     *
     * @see #renderTemplate()
     * @event rendering - before rendering
     * @event render - after render
     *
     * @return {View}
     */

  }, {
    key: 'render',
    value: function render() {
      this.emit('rendering');
      this.renderTemplate.apply(this, arguments);
      this.emit('render');

      return this;
    }
  }, {
    key: 'domify',
    value: function domify(str) {
      var div = document.createElement('div');

      div.innerHTML = str;

      return div.firstElementChild;
    }
  }, {
    key: 'handleEvents',
    value: function handleEvents(action, events) {
      var event = void 0;
      var selector = void 0;
      var callback = void 0;
      var context = void 0;
      var scope = void 0;

      for (var i = 0, len = events.length; i < len; i += 1) {
        scope = events[i];
        event = scope[0];
        selector = scope[2] ? scope[1] : null;
        callback = scope[2] ? scope[2] : scope[1];
        context = null;

        if (typeof callback !== 'function' && typeof this[callback] === 'function') {
          callback = this[callback];
          /*eslint consistent-this: 0*/
          context = this;
        }

        if (typeof callback !== 'function') {
          throw new Error('Invalid callback for event [' + event + ', ' + selector + ', ' + callback);
        }

        if (!selector) {
          this.delegate[action](event, '', callback, context);

          continue;
        }

        selector = Array.isArray(selector) ? selector : [selector];

        for (var j = 0; j < selector.length; j += 1) {
          this.delegate[action](event, selector[j], callback, context);
        }
      }
    }
  }, {
    key: 'el',
    get: function get() {
      return this.element;
    }
  }]);

  return View;
}(EventEmitter);

},{"./dom-delegate":3,"ak-eventemitter":17}],15:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }


var path = require('path');
var template = require('ak-template');
var defaults = require('stluafed');

var View = require('../view');
var Map = require('./map');

module.exports = function (_View) {
  _inherits(MainView, _View);

  function MainView() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, MainView);

    var _this = _possibleConstructorReturn(this, (MainView.__proto__ || Object.getPrototypeOf(MainView)).call(this, options));

    _this.template = template("<div>\n  <div id=\"ds-map-panel\">\n  </div>\n  <div id=\"ds-eng-panel\">\n    <!-- Templates must always have at least one wrapping div -->\n    <div id=\"ds-editor\">\n      <div id=\"ds-editor-content\" class=\"group\">\n        <div id=\"ds-editor-line-numbers\"></div>\n        <textarea id=\"ds-editor-input\"></textarea>\n      </div>\n    </div>\n    <a class=\"ds-run btn\">RUN</a>\n  </div>\n</div>\n");
    _this.lineNumberTemplate = template("<div class=\"ds-editor-line-number\" data-line-number=\"<%- locals.number %>\"><%- locals.number %></div>\n");
    _this.options = defaults(options, {
      'events': [['click', '.ds-run', 'onRunClick'], ['keypress', '#ds-editor-input', 'onEnter']]
    });

    _this.map = new Map({
      'map': _this.options.map
    });

    _this.map.on('map.walk.victory', function () {
      _this.emit('game.victory');
    });
    return _this;
  }

  _createClass(MainView, [{
    key: 'render',
    value: function render() {
      this.emit('rendering');
      this.renderTemplate.apply(this, arguments);

      var mapPanel = this.el.querySelector('#ds-map-panel');

      mapPanel.appendChild(this.map.render().el);

      this.runButton = this.el.querySelector('.ds-run');
      this.editor = {
        'numbers': this.el.querySelector('#ds-editor-line-numbers'),
        'input': this.el.querySelector('#ds-editor-input')
      };

      this.editor.input.value = 'if (sensor.scan(\'right\') == \'clear\') {\n legs.turn(\'right\')\n}\nif (sensor.scan(\'ahead\') == \'clear\') {\n legs.forward()\n}\nelse {\n if(sensor.scan(\'left\') == \'clear\') {\n  legs.turn(\'left\')\n }\n else {\n  legs.turn(\'right\')\n }\n}\n';

      this.onEnter();

      this.emit('render');

      return this;
    }
  }, {
    key: 'renderParsingLog',
    value: function renderParsingLog(log) {
      var lineNumbers = this.el.querySelectorAll('.ds-editor-line-number');

      for (var i = 0, len = lineNumbers.length; i < len; i += 1) {
        lineNumbers[i].classList.remove('ds-parsing-error');
      }

      for (var _i = 0, _len = log.length; _i < _len; _i += 1) {
        var displayedNumber = log[_i].line + 1;
        var lineNumber = this.el.querySelector('.ds-editor-line-number[data-line-number="' + displayedNumber + '"]');

        if (!lineNumber) {
          return;
        }

        lineNumber.classList.add('ds-parsing-error');
        lineNumber.title = log[_i].message;
      }
    }
  }, {
    key: 'onRunClick',
    value: function onRunClick() {
      var rawCode = this.editor.input.value;

      this.emit('program.run', rawCode);
    }
  }, {
    key: 'onEnter',
    value: function onEnter() {
      var lineCount = this.editor.input.value.split('\n').length;
      var lineNumbersHtml = '';

      for (var i = 1; i <= lineCount + 1; i += 1) {
        lineNumbersHtml += this.lineNumberTemplate({ 'number': i });
      }

      this.editor.input.rows = lineCount + 3;
      this.editor.numbers.innerHTML = lineNumbersHtml;
    }
  }]);

  return MainView;
}(View);

},{"../view":14,"./map":16,"ak-template":19,"path":22,"stluafed":24}],16:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }


var path = require('path');
var template = require('ak-template');
var defaults = require('stluafed');

var View = require('../view');

var maps = require('../maps');

module.exports = function (_View) {
  _inherits(Map, _View);

  function Map() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Map);

    var _this = _possibleConstructorReturn(this, (Map.__proto__ || Object.getPrototypeOf(Map)).call(this, options));

    _this.template = template("<div id=\"ds-map\">\n</div>\n");
    _this.mapTileTemplate = template("<div class=\"ds-map-tile\n<% if (locals.x === 0) { %>\n  clear\n<% } %>\n<% if (locals.imgClass) { %>\n  ds-sprite-wall\n  ds-sprite-<%- locals.imgClass %>\n<% } %>\n\" data-position-x=\"<%- locals.x %>\" data-position-y=\"<%- locals.y %>\">\n</div>\n");

    _this.options = defaults(options, {
      'events': [],
      'map': maps[0]
    });

    _this.map = _this.initMap(options.map);
    return _this;
  }

  _createClass(Map, [{
    key: 'render',
    value: function render() {
      this.emit('rendering');
      this.renderTemplate.apply(this, arguments);

      var mapHtml = '';

      for (var y = 0; y < this.map.length; y += 1) {
        for (var x = 0; x < this.map[y].length; x += 1) {
          mapHtml += this.mapTileTemplate(this.map[y][x]);
        }
      }

      this.el.innerHTML = mapHtml;
      this.saveTileElements();

      this.emit('render');

      return this;
    }
  }, {
    key: 'initMap',
    value: function initMap(plan) {
      var map = [];

      plan = plan.split('\n');

      for (var y = 0, ylen = plan.length; y < ylen; y += 1) {
        var row = plan[y].split('');

        map.push([]);

        for (var x = 0, xlen = row.length; x < xlen; x += 1) {
          var tile = {
            'x': x,
            'y': y,
            'type': 'floor'
          };

          if (plan[y][x] === 'W') {
            tile.type = 'wall';
            tile.imgClass = plan[y][x];
          }
          if (plan[y][x] === 'V') {
            tile.type = 'victory';
            tile.imgClass = 'victory';
          }

          map[y].push(tile);
        }
      }

      return map;
    }
  }, {
    key: 'saveTileElements',
    value: function saveTileElements() {
      for (var y = 0; y < this.map.length; y += 1) {
        for (var x = 0; x < this.map[y].length; x += 1) {
          var selector = '.ds-map-tile[data-position-x="' + x + '"][data-position-y="' + y + '"]';

          this.map[y][x].el = this.el.querySelector(selector);
        }
      }
    }
  }, {
    key: 'selectTile',
    value: function selectTile(coordinates) {
      if (!coordinates) {
        throw new Error('No coordinates provided for selectTile');
      }
      var result = null;

      result = this.map[coordinates.y] && this.map[coordinates.y][coordinates.x];

      return result;
    }
  }, {
    key: 'drawUnit',
    value: function drawUnit(unit) {
      var tile = this.selectTile(unit.position);

      if (unit.el) {
        unit.el.parentElement.removeChild(unit.el);
      }
      if (!unit.el) {
        unit.render();
      }

      tile.el.appendChild(unit.el);
    }
  }, {
    key: 'moveUnit',
    value: function moveUnit(unit, coordinates) {
      var tile = this.selectTile(coordinates);

      if (tile && tile.type !== 'wall') {
        unit.position = coordinates;
        this.drawUnit(unit);

        if (tile.type === 'victory') {
          this.emit('map.walk.victory');
        }
        return;
      }
      unit.processor.log('move disallowed');
    }
  }]);

  return Map;
}(View);

},{"../maps":5,"../view":14,"ak-template":19,"path":22,"stluafed":24}],17:[function(require,module,exports){
module.exports = require('./lib/eventemitter');

},{"./lib/eventemitter":18}],18:[function(require,module,exports){
'use strict';

/**
 * Export `EventEmitter`
 *
 * @param {Object} options (optional)
 * @return {EventEmitter}
 */
var EventEmitter = module.exports = function (options) {
  options = options || {};
  this._eventEmitter = {};
  this._eventEmitter.tree = {'children': {}};
  this._eventEmitter.delimiter = options.delimiter || '.';
};

/**
 * Call all callbacks for given tree
 *
 * @see #_searchTree();
 *
 * @param {Object} tree
 * @param {arguments} args
 */
EventEmitter.prototype._emit = function (tree, args) {
  var callbacks = tree.callbacks;

  if (! callbacks) {
    return this;
  }

  var argc = args.length;

  for (
    var i = 0,
    len = callbacks.length,
    callback;
    i < len;
    i += 1
  ) {
    callback = callbacks[i];

    if (argc === 1) {
      callback.fn.call(callback.context, args[0]);
    } else if (argc === 2) {
      callback.fn.call(callback.context, args[0], args[1]);
    } else {
      callback.fn.apply(callback.context, args);
    }

    if (callback.once) {
      callbacks.splice(i, 1);

      i -= 1;
      len -= 1;

      if (callbacks.length === 0) {
        tree.callbacks = undefined;
      }
    }
  }
};

/**
 * Parse given tree for given ns
 *
 * @see #emit();
 *
 * @param {Object} tree
 * @param {Array} ns
 * @param {Integer} start
 * @param {arguments} args
 */
EventEmitter.prototype._searchTree = function (tree, ns, start, args) {
  for (var i = start,
    len = ns.length,
    currentNs,
    currentTree,
    wildTree;
    i < len;
    i += 1
  ) {
    wildTree = tree.children['*'];

    if (wildTree) {
      if (wildTree.callbacks) {
        this._emit(wildTree, args);
      }

      this._searchTree(wildTree, ns, i + 1, args);
    }

    currentNs = ns[i];
    currentTree = tree.children[currentNs];

    if (! currentTree) {
      return this;
    }

    tree = currentTree;
  }

  if (currentTree) {
    this._emit(currentTree, args);
  }
};

/**
 * Add event listener
 *
 * @param {String} ns
 * @param {Function} callback
 * @param {Object} options (optional)
 * @return {EventEmitter}
 */
EventEmitter.prototype.on = function (ns, callback, context, once) {
  ns = ns.split(this._eventEmitter.delimiter);
  var tree = this._eventEmitter.tree;
  var currentNs;
  var currentTree;

  for (var i = 0, len = ns.length; i < len; i += 1) {
    currentNs = ns[i];
    currentTree = tree.children[currentNs];

    if (! currentTree) {
      currentTree = tree.children[currentNs] = {'children': {}};
    }

    tree = currentTree;
  }

  if (! tree.callbacks) {
    tree.callbacks = [];
  }

  tree.callbacks.push({
    'fn': callback,
    'context': context ? context : this,
    'once': !! once
  });

  return this;
};

/**
 * Remove event listener
 *
 * @param {String} ns
 * @param {Function} callback
 * @param {Object} options (optional)
 * @return {EventEmitter}
 */
EventEmitter.prototype.off = function (ns, callback, context) {
  if (! ns) {
    this._eventEmitter.tree = {'children': {}};

    return this;
  }

  ns = ns.split(this._eventEmitter.delimiter);
  var tree = this._eventEmitter.tree;
  var currentTree;

  for (var i = 0, len = ns.length; i < len; i += 1) {
    currentTree = tree.children[ns[i]];

    if (! currentTree) {
      return this;
    }

    tree = currentTree;
  }

  if (! callback) {
    tree.callbacks = undefined;

    return this;
  }

  if (! tree.callbacks) {
    return this;
  }

  for (
    var i2 = 0,
    callbacks = tree.callbacks,
    len2 = callbacks.length,
    currentCallback;
    i2 < len2;
    i2 += 1
  ) {
    currentCallback = callbacks[i2];

    if (currentCallback.fn === callback) {
      if (context && context !== currentCallback.context) {
        continue;
      }

      callbacks.splice(i2, 1);

      break;
    }
  }

  if (! callbacks.length) {
    tree.callbacks = undefined;
  }

  return this;
};

/**
 * Emit event
 *
 * @param {String} ns
 * @param {*} ... (optional)
 * @return {EventEmitter}
 */
EventEmitter.prototype.emit = function (ns) {
  ns = ns.split(this._eventEmitter.delimiter);

  this._searchTree(this._eventEmitter.tree, ns, 0, arguments);

  return this;
};

/**
 * Add event listener for once
 *
 * @param {String} ns
 * @param {Function} callback
 * @param {Object} options (optional)
 * @return {EventEmitter}
 */
EventEmitter.prototype.once = function (ns, callback, context) {
  this.on(ns, callback, context, true);

  return this;
};

},{}],19:[function(require,module,exports){
module.exports = require('./lib/template');

},{"./lib/template":20}],20:[function(require,module,exports){
'use strict';

/**
 * Dependencies
 */
var defaults = require('stluafed');

/**
 * Export `template`
 *
 * @param {String} str
 * @return {Function}
 */
var template = module.exports = function (str) {
  var tpl = template.cache[str];

  if (tpl) {
    return tpl;
  }

  /*jshint evil: true*/
  tpl = (new Function(
    'locals',
    'locals = this.defaults(locals || {}, this.globals);' +
    'var __p = [];' +
    '__p.push(\'' +
    str.replace(/[\r\t\n]/g, ' ')
      .replace(/'(?=[^%]*%>)/g, '\t')
      .split('\'').join('\\\'')
      .split('\t').join('\'')
      .replace(/<%=(.+?)%>/g, '\',$1,\'')
      .replace(/<%-(.+?)%>/g, '\',this.escape($1),\'')
      .split('<%').join('\');')
      .split('%>').join('__p.push(\'') +
    '\');return __p.join(\'\');'
  )).bind({
    'defaults': defaults,
    'globals': template.globals,
    'escape': template.escape
  });
  /*jshint evil: false*/

  template.cache[str] = tpl;

  return tpl;
};

/**
 * Globals are merged into `locals`
 */
template.globals = {};

/**
 * Cache
 */
template.cache = {};

/**
 * Escape function for <%- variable %>, can be overridden (default escape HTML)
 *
 * @param {String} str
 * @return {Function}
 */
template.escape = function (str) {
  return (str + '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39');
};

},{"stluafed":21}],21:[function(require,module,exports){
'use strict';

/**
 * Merge default values.
 *
 * @param {Object} dest
 * @param {Object} defaults
 * @return {Object}
 * @api public
 */
var defaults = function (dest, src, recursive) {
  for (var prop in src) {
    if (recursive && dest[prop] instanceof Object && src[prop] instanceof Object) {
      dest[prop] = defaults(dest[prop], src[prop], true);
    } else if (! (prop in dest)) {
      dest[prop] = src[prop];
    }
  }

  return dest;
};

/**
 * Expose `defaults`.
 */
module.exports = defaults;

},{}],22:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":23}],23:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],24:[function(require,module,exports){
'use strict';

/**
 * Merge default values.
 *
 * @param {Object} dest destination object
 * @param {Object} src source object
 * @param {Boolean} recursive merge into destination recursively (default: false)
 * @return {Object} dest object
 */
var defaults = function (dest, src, recursive) {
  for (var prop in src) {
    if (! src.hasOwnProperty(prop)) {
      continue;
    }

    if (recursive && dest[prop] instanceof Object && src[prop] instanceof Object) {
      dest[prop] = defaults(dest[prop], src[prop], true);
    } else if (! (prop in dest)) {
      dest[prop] = src[prop];
    }
  }

  return dest;
};

/**
 * Expose `defaults`.
 */
module.exports = defaults;

},{}]},{},[1])

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9kaXJlY3Rpb25zLmpzIiwibGliL2RvbS1kZWxlZ2F0ZS5qcyIsImxpYi9pbmRleC5qcyIsImxpYi9tYXBzL2luZGV4LmpzIiwibGliL3BhcnNlci9kZXRlY3QtdHlwZS5qcyIsImxpYi9wYXJzZXIvZXhwcmVzc2lvbi1wYXJzZXIuanMiLCJsaWIvcGFyc2VyL2luZGV4LmpzIiwibGliL3VuaXQvaW5kZXguanMiLCJsaWIvdW5pdC9tb2R1bGVzL2luZGV4LmpzIiwibGliL3VuaXQvbW9kdWxlcy9zZW5zb3IuanMiLCJsaWIvdW5pdC9tb2R1bGVzL3doZWVscy5qcyIsImxpYi91bml0L3Byb2Nlc3Nvci5qcyIsImxpYi92aWV3LmpzIiwibGliL3ZpZXdzL21haW4tdmlldy5qcyIsImxpYi92aWV3cy9tYXAuanMiLCJub2RlX21vZHVsZXMvYWstZXZlbnRlbWl0dGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2FrLWV2ZW50ZW1pdHRlci9saWIvZXZlbnRlbWl0dGVyLmpzIiwibm9kZV9tb2R1bGVzL2FrLXRlbXBsYXRlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2FrLXRlbXBsYXRlL2xpYi90ZW1wbGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9hay10ZW1wbGF0ZS9ub2RlX21vZHVsZXMvc3RsdWFmZWQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9zdGx1YWZlZC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxjQUFjLFFBQVEsYUFBUixDQUFsQjtBQUNBLElBQUksY0FBYyxJQUFJLFdBQUosRUFBbEI7O0FBRUEsWUFBWSxJQUFaLENBQWlCLEVBQWpCLENBQW9CLFFBQXBCLEVBQThCLFNB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvT0E7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibGV0IEFwcGxpY2F0aW9uID0gcmVxdWlyZSgnLi9saWIvaW5kZXgnKTtcbmxldCBhcHBsaWNhdGlvbiA9IG5ldyBBcHBsaWNhdGlvbigpO1xuXG5hcHBsaWNhdGlvbi52aWV3Lm9uKCdyZW5kZXInLCBmdW5jdGlvbiBydW4gKCkge1xuICBhcHBsaWNhdGlvbi5ydW4oKTtcbn0pO1xuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhcHBsaWNhdGlvbi52aWV3LnJlbmRlcigpLmVsKTtcbiIsImxldCByZWxhdGl2ZSA9IHtcbiAgJ2FoZWFkJzogMCxcbiAgJ3JpZ2h0JzogMSxcbiAgJ2JlaGluZCc6IDIsXG4gICdsZWZ0JzogLSAxXG59O1xubGV0IGFic29sdXRlID0gWydub3J0aCcsICd3ZXN0JywgJ3NvdXRoJywgJ2Vhc3QnXTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICdhYnNvbHV0ZSc6IGFic29sdXRlLFxuICAncmVsYXRpdmUnOiByZWxhdGl2ZSxcbiAgJ2dldEFic29sdXRlRnJvbVR1cm4nOiAoY3VycmVudERpcmVjdGlvbiwgdHVybikgPT4ge1xuICAgIGxldCBkaXIgPSBhYnNvbHV0ZS5pbmRleE9mKGN1cnJlbnREaXJlY3Rpb24pO1xuICAgIGxldCBjbG9jayA9IHtcbiAgICAgICdjbG9jayc6IDEsXG4gICAgICAncmlnaHQnOiAxLFxuICAgICAgJ2NvdW50ZXInOiAtIDEsXG4gICAgICAnbGVmdCc6IC0gMVxuICAgIH07XG5cbiAgICBkaXIgPSAoKGRpciArIGNsb2NrW3R1cm5dKSAlIGFic29sdXRlLmxlbmd0aCArIGFic29sdXRlLmxlbmd0aCkgJSBhYnNvbHV0ZS5sZW5ndGg7XG5cbiAgICByZXR1cm4gYWJzb2x1dGVbZGlyXTtcbiAgfSxcbiAgJ2dldEFic29sdXRlRnJvbVJlbGF0aXZlJzogKGN1cnJlbnREaXJlY3Rpb24sIHJlbCkgPT4ge1xuICAgIGxldCBkaXIgPSBhYnNvbHV0ZS5pbmRleE9mKGN1cnJlbnREaXJlY3Rpb24pO1xuXG4gICAgaWYgKCEgcmVsYXRpdmUuaGFzT3duUHJvcGVydHkocmVsKSkge1xuICAgICAgcmV0dXJuIHJlbDtcbiAgICB9XG5cbiAgICBkaXIgPSAoKGRpciArIHJlbGF0aXZlW3JlbF0pICUgYWJzb2x1dGUubGVuZ3RoICsgYWJzb2x1dGUubGVuZ3RoKSAlIGFic29sdXRlLmxlbmd0aDtcblxuICAgIHJldHVybiBhYnNvbHV0ZVtkaXJdO1xuICB9LFxuICAnZ2V0TmV4dFRpbGVDb29yZGluYXRlcyc6IChjb29yZGluYXRlcywgZGlyZWN0aW9uKSA9PiB7XG4gICAgbGV0IHggPSBjb29yZGluYXRlcy54O1xuICAgIGxldCB5ID0gY29vcmRpbmF0ZXMueTtcbiAgICBsZXQgbW92ZW1lbnQgPSB7XG4gICAgICAnbm9ydGgnOiAoKSA9PiB7XG4gICAgICAgIHkgLT0gMTtcbiAgICAgIH0sXG4gICAgICAnd2VzdCc6ICgpID0+IHtcbiAgICAgICAgeCArPSAxO1xuICAgICAgfSxcbiAgICAgICdzb3V0aCc6ICgpID0+IHtcbiAgICAgICAgeSArPSAxO1xuICAgICAgfSxcbiAgICAgICdlYXN0JzogKCkgPT4ge1xuICAgICAgICB4IC09IDE7XG4gICAgICB9XG4gICAgfTtcblxuICAgIG1vdmVtZW50W2RpcmVjdGlvbl0oKTtcblxuICAgIHJldHVybiB7J3gnOiB4LCAneSc6IHl9O1xuICB9XG59O1xuIiwiLyoqXG4gKiBoZWxwZXJcbiAqL1xubGV0IG1hdGNoQW5jZXN0b3JPZiA9IChjaGlsZCwgcGFyZW50U2VsZWN0b3IsIHN0b3BBdEVsZW1lbnQpID0+IHtcbiAgaWYgKCEgcGFyZW50U2VsZWN0b3IpIHtcbiAgICByZXR1cm4gc3RvcEF0RWxlbWVudDtcbiAgfVxuXG4gIGlmICghIGNoaWxkIHx8IGNoaWxkID09PSBzdG9wQXRFbGVtZW50KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKGNoaWxkLm1hdGNoZXMocGFyZW50U2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIGNoaWxkO1xuICB9XG5cbiAgcmV0dXJuIG1hdGNoQW5jZXN0b3JPZihjaGlsZC5wYXJlbnRFbGVtZW50LCBwYXJlbnRTZWxlY3Rvciwgc3RvcEF0RWxlbWVudCk7XG59O1xuXG4vKipcbiAqIEBjbGFzcyBEb21EZWxlZ2F0ZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERvbURlbGVnYXRlIHtcbiAgLyoqXG4gICAqIGNvbnN0cnVjdG9yXG4gICAqXG4gICAqIEBwYXJhbSB7RWxlbWVudH0gcm9vdCAtIHJvb3QgZWxlbWVudCB3aGljaCB3aWxsIGJlIGFjdHVhbGx5IGJvdW5kXG4gICAqL1xuICBjb25zdHJ1Y3RvciAocm9vdCkge1xuICAgIGlmICghIHJvb3QpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBgcm9vdGAgYXJndW1lbnQnKTtcbiAgICB9XG5cbiAgICB0aGlzLnJvb3QgPSByb290O1xuICAgIHRoaXMuZXZlbnRzID0ge307XG4gIH1cblxuICAvL1RoZSBjYWxsYmFjayBoYXMgdGhlIGZvbGxvdyBzaWduYXR1cmU6XG4gIC8vXG4gIC8vYGBgXG4gIC8vZnVuY3Rpb24gY2FsbGJhY2soZG9tTmF0aXZlRXZlbnQsIGV4dHJhRGF0YSlcbiAgLy9cbiAgLy9leHRyYURhdGEgPSB7XG4gIC8vICAnbWF0Y2hlZFRhcmdldCc6IEhUTUxFbGVtZW50IC8vIHRoaXMgaXMgdGhlIGVsZW1lbnQgd2hpY2ggbWF0Y2hlcyBnaXZlbiBzZWxlY3RvclxuICAvL31cbiAgLy9gYGBcbiAgLyoqXG4gICAqIGFkZCBsaXN0ZW5lclxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAqIEBwYXJhbSB7Kn0gW2NvbnRleHRdXG4gICAqIEByZXR1cm4ge0RvbURlbGVnYXRlfVxuICAgKi9cbiAgb24gKGV2ZW50LCBzZWxlY3RvciwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb250ZXh0ID0gY2FsbGJhY2s7XG4gICAgICBjYWxsYmFjayA9IHNlbGVjdG9yO1xuICAgICAgc2VsZWN0b3IgPSAnJztcbiAgICB9XG5cbiAgICBpZiAoISBjYWxsYmFjaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIGBjYWxsYmFja2AgYXJndW1lbnQnKTtcbiAgICB9XG5cbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8ICcnO1xuICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IG51bGw7XG5cbiAgICBsZXQgY2FsbGJhY2tzID0gdGhpcy5ldmVudHNbZXZlbnRdO1xuXG4gICAgLy9XZSBhZGQgb25seSBvbmUgbGlzdGVuZXIgcGVyIGV2ZW50IGFuZCB0aGVuIGxvb2sgZm9yIG1hdGNoaW5nIGRlbGVnYXRpb24gbGF0ZXJcbiAgICBpZiAoISBjYWxsYmFja3MpIHtcbiAgICAgIGNhbGxiYWNrcyA9IHRoaXMuZXZlbnRzW2V2ZW50XSA9IFtdO1xuXG4gICAgICBsZXQgZGVsZWdhdGUgPSB0aGlzLmV2ZW50c1tldmVudF0uZGVsZWdhdGlvbkNhbGxiYWNrID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5ldmVudHNbZXZlbnRdXG4gICAgICAgICAgLmZpbHRlcigoc2NvcGUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhIHNjb3BlLnNlbGVjdG9yICYmIGUudGFyZ2V0ID09PSB0aGlzLnJvb3QgfHwgbWF0Y2hBbmNlc3Rvck9mKGUudGFyZ2V0LCBzY29wZS5zZWxlY3RvciwgdGhpcy5yb290KTtcbiAgICAgICAgICB9KS5mb3JFYWNoKChzY29wZSkgPT4ge1xuICAgICAgICAgICAgbGV0IG1hdGNoZWRUYXJnZXQgPSBzY29wZS5zZWxlY3RvciA9PT0gJycgJiYgdGhpcy5yb290IHx8IG1hdGNoQW5jZXN0b3JPZihlLnRhcmdldCwgc2NvcGUuc2VsZWN0b3IsIHRoaXMucm9vdCk7XG5cbiAgICAgICAgICAgIGlmIChzY29wZS5jb250ZXh0KSB7XG4gICAgICAgICAgICAgIHJldHVybiBzY29wZS5jYWxsYmFjay5jYWxsKHNjb3BlLmNvbnRleHQsIGUsIHsnbWF0Y2hlZFRhcmdldCc6IG1hdGNoZWRUYXJnZXR9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2NvcGUuY2FsbGJhY2soZSwgeydtYXRjaGVkVGFyZ2V0JzogbWF0Y2hlZFRhcmdldH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5yb290LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGRlbGVnYXRlLCB0cnVlKTtcbiAgICB9XG5cbiAgICBjYWxsYmFja3MucHVzaCh7XG4gICAgICAnc2VsZWN0b3InOiBzZWxlY3RvcixcbiAgICAgICdjYWxsYmFjayc6IGNhbGxiYWNrLFxuICAgICAgJ2NvbnRleHQnOiBjb250ZXh0XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiByZW1vdmUgZXZlbnQgbGlzdGVuZXJcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IFtldmVudF1cbiAgICogQHBhcmFtIHtTdHJpbmd9IFtzZWxlY3Rvcl1cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXVxuICAgKiBAcGFyYW0geyp9IFtjb250ZXh0XVxuICAgKiBAcmV0dXJuIHtEb21EZWxlZ2F0ZX1cbiAgICovXG4gIC8qZXNsaW50IGNvbXBsZXhpdHk6IFsyLCAyMF0qL1xuICBvZmYgKGV2ZW50LCBzZWxlY3RvciwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICBsZXQgYXJpdHkgPSBhcmd1bWVudHMubGVuZ3RoO1xuXG4gICAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29udGV4dCA9IGNhbGxiYWNrO1xuICAgICAgY2FsbGJhY2sgPSBzZWxlY3RvcjtcbiAgICAgIHNlbGVjdG9yID0gJyc7XG4gICAgfVxuXG4gICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCAnJztcbiAgICBjb250ZXh0ID0gY29udGV4dCB8fCBudWxsO1xuXG4gICAgaWYgKGFyaXR5ID09PSAwKSB7XG4gICAgICBmb3IgKGV2ZW50IGluIHRoaXMuZXZlbnRzKSB7XG4gICAgICAgIHRoaXMucm9vdC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCB0aGlzLmV2ZW50c1tldmVudF0uZGVsZWdhdGlvbkNhbGxiYWNrLCB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5ldmVudHMgPSB7fTtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKCEgdGhpcy5ldmVudHNbZXZlbnRdKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoYXJpdHkgPT09IDEpIHtcbiAgICAgIHRoaXMucm9vdC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCB0aGlzLmV2ZW50c1tldmVudF0uZGVsZWdhdGlvbkNhbGxiYWNrLCB0cnVlKTtcblxuICAgICAgZGVsZXRlIHRoaXMuZXZlbnRzW2V2ZW50XTtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbGV0IGRlbGVnYXRpb25DYWxsYmFjayA9IHRoaXMuZXZlbnRzW2V2ZW50XS5kZWxlZ2F0aW9uQ2FsbGJhY2s7XG5cbiAgICB0aGlzLmV2ZW50c1tldmVudF0gPSB0aGlzLmV2ZW50c1tldmVudF0uZmlsdGVyKChzY29wZSkgPT4ge1xuICAgICAgcmV0dXJuICEgKGFyaXR5ID09PSAyICYmIHNjb3BlLnNlbGVjdG9yID09PSBzZWxlY3RvclxuICAgICAgICB8fCBhcml0eSA9PT0gMyAmJiBzY29wZS5zZWxlY3RvciA9PT0gc2VsZWN0b3IgJiYgc2NvcGUuY2FsbGJhY2sgPT09IGNhbGxiYWNrXG4gICAgICAgIHx8IGFyaXR5ID09PSA0ICYmIHNjb3BlLnNlbGVjdG9yID09PSBzZWxlY3RvciAmJiBzY29wZS5jYWxsYmFjayA9PT0gY2FsbGJhY2sgJiYgc2NvcGUuY29udGV4dCA9PT0gY29udGV4dCk7XG4gICAgfSk7XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmRlbGVnYXRpb25DYWxsYmFjayA9IGRlbGVnYXRpb25DYWxsYmFjaztcblxuICAgIGlmICghIHRoaXMuZXZlbnRzW2V2ZW50XS5sZW5ndGgpIHtcbiAgICAgIHRoaXMucm9vdC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCB0aGlzLmV2ZW50c1tldmVudF0uZGVsZWdhdGlvbkNhbGxiYWNrLCB0cnVlKTtcblxuICAgICAgZGVsZXRlIHRoaXMuZXZlbnRzW2V2ZW50XTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBkZXN0cnVjdG9yXG4gICAqL1xuICBkZXN0cm95ICgpIHtcbiAgICB0aGlzLm9mZigpO1xuXG4gICAgdGhpcy5yb290ID0gbnVsbDtcbiAgICB0aGlzLmV2ZW50cyA9IG51bGw7XG4gIH1cbn07XG4iLCJsZXQgTWFpblZpZXcgPSByZXF1aXJlKCcuL3ZpZXdzL21haW4tdmlldycpO1xubGV0IFVuaXQgPSByZXF1aXJlKCcuL3VuaXQnKTtcbmxldCBwYXJzZSA9IHJlcXVpcmUoJy4vcGFyc2VyJyk7XG5cbmxldCBtYXBzID0gcmVxdWlyZSgnLi9tYXBzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQXBwbGljYXRpb24ge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy52aWV3ID0gbmV3IE1haW5WaWV3KHtcbiAgICAgICdtYXAnOiBtYXBzWzBdXG4gICAgfSk7XG4gICAgdGhpcy5kd2FyZiA9IG5ldyBVbml0KHtcbiAgICAgICd0eXBlJzogJ2R3YXJmJyxcbiAgICAgICduYW1lJzogJ0dpbWxldCcsXG4gICAgICAnbW9kdWxlcyc6IFtcbiAgICAgICAgJ2xlZ3MnLFxuICAgICAgICAnc2Vuc29yJ1xuICAgICAgXSxcbiAgICAgICdtYXAnOiB0aGlzLnZpZXcubWFwXG4gICAgfSk7XG5cbiAgICB0aGlzLnZpZXcub24oJ3Byb2dyYW0ucnVuJywgdGhpcy5vblByb2dyYW1SdW4uYmluZCh0aGlzKSk7XG4gICAgdGhpcy52aWV3Lm9uKCdnYW1lLnZpY3RvcnknLCB0aGlzLm9uVmljdG9yeS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmR3YXJmLm9uKCd1bml0Lm1vdmUnLCB0aGlzLm9uVW5pdE1vdmUuYmluZCh0aGlzKSk7XG4gIH1cblxuICBydW4gKCkge1xuICAgIHRoaXMuZHdhcmYucG9zaXRpb24gPSB7J3gnOiAxLCAneSc6IDJ9O1xuICAgIHRoaXMudmlldy5tYXAuZHJhd1VuaXQodGhpcy5kd2FyZik7XG4gIH1cblxuICBvblByb2dyYW1SdW4gKGUsIGNvZGUpIHtcbiAgICBpZiAodGhpcy5kd2FyZi5wcm9jZXNzb3IucnVubmluZykge1xuICAgICAgdGhpcy5kd2FyZi5wcm9jZXNzb3IucnVubmluZyA9IGZhbHNlO1xuICAgICAgdGhpcy52aWV3LnJ1bkJ1dHRvbi5pbm5lckhUTUwgPSAnUlVOJztcbiAgICAgIHRoaXMudmlldy5ydW5CdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgnZHMtZXhlY3V0aW9uLXN0b3AnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgcHJvZ3JhbSA9IHBhcnNlKGNvZGUpO1xuXG4gICAgaWYgKHByb2dyYW0uc3RhdHVzID09PSAnb2snKSB7XG4gICAgICB0aGlzLmR3YXJmLnJ1bihwcm9ncmFtLnRyZWUpO1xuICAgICAgdGhpcy52aWV3LnJ1bkJ1dHRvbi5pbm5lckhUTUwgPSAnU1RPUCc7XG4gICAgICB0aGlzLnZpZXcucnVuQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2RzLWV4ZWN1dGlvbi1zdG9wJyk7XG4gICAgfVxuICAgIHRoaXMudmlldy5yZW5kZXJQYXJzaW5nTG9nKHByb2dyYW0ubG9nKTtcbiAgfVxuXG4gIG9uVmljdG9yeSAoKSB7XG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tYWxlcnQgKi9cbiAgICB0aGlzLm9uUHJvZ3JhbVJ1bigpO1xuICAgIGFsZXJ0KCdXb3cgY29uZ3JhdHMgeW91IHdvbiAhIScpO1xuICB9XG5cbiAgb25Vbml0TW92ZSAoZSwgdW5pdCwgY29vcmRpbmF0ZXMpIHtcbiAgICB0aGlzLnZpZXcubWFwLm1vdmVVbml0KHVuaXQsIGNvb3JkaW5hdGVzKTtcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICBgXG5XV1dXV1dXV1dXV1dXV1dcbldfV19fX19fV19fX19XV1xuV19XX1dfV19fX1dXX19XXG5XX19fV19XV1dXV1dXX1dcbldXV1dXX19XV19fX1dfV1xuV19fX1dXX1dfX1dfX19XXG5XX1dfX19fV19XV1dXV1dcbldfV1dXV1dXX19fX19fV1xuV19fV19fX19fV1dXV19XXG5XX1dXV1dXV19fX1dfX1dcbldfV19fX19XV1dXV19XV1xuV19XX1dXX1dfX19XX19XXG5XX1dfV1dXV19XX1dXX1dcbldfX19fV1ZfX1dfX19fV1xuV1dXV1dXV1dXV1dXV1dXXG5gLFxuICBgQUJCQkJCQkJCQkJCQ1xuREVFRUVFRUVFRUVFRlxuR19fX19fX19fX19fSVxuR19fX01OX19fX19fSVxuR19fX09QX19fX19fSVxuR19fX1FSX19fX19fSVxuR19fX1NUX19fX19fSVxuR19fX19fX19fX19fSVxuR19fX19fX19NTl9fSVxuR19fX19fX19JR19fSVxuSktLS0tLS0tWVUtLTGBcbl07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRldGVjdFR5cGUgKGxpbmUpIHtcbiAgbGV0IHBhdHRlcm5zID0ge1xuICAgICdpZic6IC9eaWZcXChbYS16QS16MC05IC4rXFwtKi8hPSdcXChcXCldezAsfVxcKVxceyQvLFxuICAgICdhc3NpZ24nOiAvPS8sXG4gICAgJ2NhbGwnOiAvXFwoW2EtekEtejAtOSwgK1xcLSovPSdcXChcXCldezAsfVxcKSQvLFxuICAgICdjbG9zaW5nQnJhY2tldCc6IC9efSQvLFxuICAgICdzdHJpbmcnOiAvJ1thLXpBLXowLTksICtcXC0qLz0nXFwoXFwpXXswLH0nL1xuICB9O1xuXG4gIGZvciAobGV0IGtleSBpbiBwYXR0ZXJucykge1xuICAgIGlmIChsaW5lLm1hdGNoKHBhdHRlcm5zW2tleV0pKSB7XG4gICAgICByZXR1cm4geyd0eXBlJzoga2V5LCAnc3RhdHVzJzogJ29rJ307XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsndHlwZSc6ICd1bmtub3duJywgJ3N0YXR1cyc6ICdlcnJvcid9O1xufTtcbiIsImxldCBkZXRlY3RUeXBlID0gcmVxdWlyZSgnLi9kZXRlY3QtdHlwZScpO1xuXG5sZXQgYm9vbGVhbk9wZXJhdG9ycyA9IHtcbiAgJz09JzogJ2VxdWFscycsXG4gICchPSc6ICdub3RlcXVhbHMnXG59O1xuXG5sZXQgZXhwcmVzc2lvblBhcnNlciA9IG1vZHVsZS5leHBvcnRzID0ge1xuICAnaWYnOiAobGluZSkgPT4ge1xuICAgIGxldCBpbmZvID0ge307XG4gICAgbGV0IHN0YXJ0ID0gbGluZS5pbmRleE9mKCcoJykgKyAxO1xuICAgIGxldCBlbmQgPSBsaW5lLmxhc3RJbmRleE9mKCcpJyk7XG4gICAgbGV0IGV4cCA9IGxpbmUuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpO1xuICAgIC8vbGV0IGV4cCA9IGxpbmUubWF0Y2goL1xcKFthLXpBLXowLTkgK1xcLSovPSdcXChcXCldezAsfVxcKS9nKVswXTtcblxuICAgIGluZm8uY29uZGl0aW9uID0gZXhwcmVzc2lvblBhcnNlci5ib29sZWFuKGV4cCk7XG4gICAgaW5mby50eXBlID0gJ2lmJztcblxuICAgIHJldHVybiBpbmZvO1xuICB9LFxuICAnY2FsbCc6IChsaW5lKSA9PiB7XG4gICAgbGV0IGluZm8gPSB7fTtcbiAgICBsZXQgc3RhcnQgPSBsaW5lLmluZGV4T2YoJygnKSArIDE7XG4gICAgbGV0IGVuZCA9IGxpbmUubGFzdEluZGV4T2YoJyknKTtcbiAgICBsZXQgcGFyZW4gPSBsaW5lLnN1YnN0cmluZyhzdGFydCwgZW5kKTtcbiAgICAvL2xldCBwYXJlbiA9IGxpbmUubWF0Y2goL1xcKFthLXpBLXowLTksICtcXC0qLz0nXFwoXFwpXXswLH1cXCkvZylbMF07XG4gICAgbGV0IG1ldGhvZE5hbWUgPSBsaW5lLnNwbGl0KCcoJylbMF07XG5cbiAgICBpbmZvLm1ldGhvZCA9IG1ldGhvZE5hbWUuc3BsaXQoJy4nKTtcbiAgICBpbmZvLmFyZ3VtZW50cyA9IFtdO1xuICAgIGluZm8udHlwZSA9ICdjYWxsJztcblxuICAgIGlmIChwYXJlbi5sZW5ndGgpIHtcbiAgICAgIGxldCBhcmdzID0gcGFyZW4uc3BsaXQoJywnKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGFyZ3MubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgaW5mby5hcmd1bWVudHMucHVzaChxdWlja1BhcnNlKGFyZ3NbaV0pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW5mbztcbiAgfSxcbiAgJ2Fzc2lnbic6IChsaW5lKSA9PiB7XG4gICAgbGV0IGluZm8gPSB7fTtcbiAgICBsZXQgc3BsaXRMaW5lID0gbGluZS5zcGxpdCgnPScpO1xuXG4gICAgaW5mby52YXJpYWJsZSA9IHNwbGl0TGluZVswXTtcbiAgICBpbmZvLnZhbHVlID0gc3BsaXRMaW5lWzFdO1xuICAgIGluZm8udHlwZSA9ICdhc3NpZ24nO1xuXG4gICAgcmV0dXJuIGluZm87XG4gIH0sXG4gICdzdHJpbmcnOiAobGluZSkgPT4ge1xuICAgIGxldCBpbmZvID0ge307XG4gICAgbGV0IHF1b3RlcyA9IGxpbmUubWF0Y2goLydbYS16QS16MC05ICtcXC0qLz0nXFwoXFwpXXswLH0nL2cpWzBdO1xuXG4gICAgaW5mby50eXBlID0gJ3N0cmluZyc7XG4gICAgaW5mby52YWx1ZSA9IHF1b3Rlcy5zdWJzdHJpbmcoMSwgcXVvdGVzLmxlbmd0aCAtIDEpO1xuXG4gICAgcmV0dXJuIGluZm87XG4gIH0sXG4gICdib29sZWFuJzogKGxpbmUpID0+IHtcbiAgICBsZXQgaW5mbyA9IHt9O1xuICAgIGxldCBvcGVyYXRvciA9ICcnO1xuXG4gICAgZm9yIChsZXQga2V5IGluIGJvb2xlYW5PcGVyYXRvcnMpIHtcbiAgICAgIGlmIChsaW5lLm1hdGNoKGtleSkpIHtcbiAgICAgICAgb3BlcmF0b3IgPSBrZXk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGluZSA9IGxpbmUuc3BsaXQob3BlcmF0b3IpO1xuXG4gICAgaW5mby5vcGVyYXRvciA9IGJvb2xlYW5PcGVyYXRvcnNbb3BlcmF0b3JdO1xuICAgIGluZm8uYSA9IHF1aWNrUGFyc2UobGluZVswXSk7XG4gICAgaW5mby5iID0gcXVpY2tQYXJzZShsaW5lWzFdKTtcbiAgICBpbmZvLnR5cGUgPSAnYm9vbGVhbic7XG5cbiAgICByZXR1cm4gaW5mbztcbiAgfVxufTtcblxuZnVuY3Rpb24gcXVpY2tQYXJzZSAoZXhwKSB7XG4gIGxldCB0eXBlID0gZGV0ZWN0VHlwZShleHApO1xuXG4gIGlmICh0eXBlLnN0YXR1cyA9PT0gJ2Vycm9yJykge1xuICAgIHRocm93IG5ldyBFcnJvcihgY291bGRudCBkZXRlcm1pbmUgdHlwZSBvZiAke2V4cH1gKTtcbiAgfVxuXG4gIHJldHVybiBleHByZXNzaW9uUGFyc2VyW3R5cGUudHlwZV0oZXhwKTtcbn1cbiIsImxldCBleHByZXNzaW9uUGFyc2VyID0gcmVxdWlyZSgnLi9leHByZXNzaW9uLXBhcnNlcicpO1xubGV0IGRldGVjdFR5cGUgPSByZXF1aXJlKCcuL2RldGVjdC10eXBlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2UgKGNvZGUpIHtcbiAgbGV0IHByb2dyYW0gPSB7XG4gICAgJ2xvZyc6IFtdLFxuICAgICdzdGF0dXMnOiAnb2snLFxuICAgICd0cmVlJzogW10sXG4gICAgJ3dlaWdodCc6IDBcbiAgfTtcblxuICBsZXQgcmVjdXJzaW9uc0NvdW50ID0gMDtcblxuICAvLyBjb2RlID0gbm9ybWFsaXplQ29kZShjb2RlKTtcblxuICBsZXQgbGluZXMgPSBjb2RlLnNwbGl0KCdcXG4nKTtcblxuICBwcm9ncmFtLnRyZWUgPSBjbGlwICgwLCBsaW5lcy5sZW5ndGgpO1xuXG4gIGZ1bmN0aW9uIGNsaXAgKHN0YXJ0LCBlbmQpIHtcbiAgICByZWN1cnNpb25zQ291bnQgKz0gMTtcblxuICAgIGlmIChyZWN1cnNpb25zQ291bnQgPiAyMDApIHtcbiAgICAgIGxvZ0Vycm9yKHN0YXJ0LCAnUGFyc2VyIGVycm9yOiBUb28gbWFueSByZWN1cnNpb25zJyk7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgbGV0IHRyZWUgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSArPSAxKSB7XG4gICAgICBsZXQgbGluZSA9IGxpbmVzW2ldLnJlcGxhY2UoLyAvZywgJycpO1xuXG4gICAgICBpZiAobGluZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGxldCBsaW5lVHlwZSA9IGRldGVjdFR5cGUobGluZSk7XG5cbiAgICAgIGlmIChsaW5lVHlwZS5zdGF0dXMgPT09ICdlcnJvcicpIHtcbiAgICAgICAgbG9nRXJyb3IoaSwgJ1BhcnNlciBlcnJvcjogQ291bGQgbm90IGRldGVybWluZSBsaW5lIHR5cGUnKTtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuXG4gICAgICBsaW5lVHlwZSA9IGxpbmVUeXBlLnR5cGU7XG5cbiAgICAgIGlmIChsaW5lVHlwZSA9PT0gJ2Nsb3NpbmdCcmFja2V0Jykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgbGV0IG9wZXJhdGlvbiA9IHtcbiAgICAgICAgJ3R5cGUnOiBsaW5lVHlwZSxcbiAgICAgICAgJ3Jhdyc6IGxpbmUsXG4gICAgICAgICdzdWJUcmVlJzogW11cbiAgICAgIH07XG4gICAgICBsZXQgbGluZUluZm8gPSBleHByZXNzaW9uUGFyc2VyW2xpbmVUeXBlXShsaW5lKTtcblxuICAgICAgZm9yIChsZXQga2V5IGluIGxpbmVJbmZvKSB7XG4gICAgICAgIG9wZXJhdGlvbltrZXldID0gbGluZUluZm9ba2V5XTtcbiAgICAgIH1cblxuICAgICAgaWYgKGxpbmVUeXBlID09PSAnaWYnKSB7XG4gICAgICAgIGxldCBlbmRpZiA9IGZpbmRDbG9zaW5nQnJhY2tldCAoaSwgZW5kKTtcbiAgICAgICAgbGV0IHJlc3RhcnRBdCA9IGVuZGlmO1xuXG4gICAgICAgIGlmIChlbmRpZiA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgIGxvZ0Vycm9yKGksICdQYXJzZXIgZXJyb3I6IGNvdWxkIG5vdCBmaW5kIG1hdGNoaW5nIGNsb3NpbmcgYnJhY2tldCcpO1xuICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9wZXJhdGlvbi5zdWJUcmVlID0gY2xpcChpICsgMSwgZW5kaWYpO1xuXG4gICAgICAgIC8vV2UgY2hlY2sgdGhlIG5leHQgbGluZSBpZiB0aGVyZSBpcyBhIGlmXG4gICAgICAgIGxldCBuZXh0TGluZSA9IGxpbmVzW2VuZGlmICsgMV07XG5cbiAgICAgICAgbmV4dExpbmUgPSBuZXh0TGluZS5yZXBsYWNlKC8gL2csICcnKTtcblxuICAgICAgICBpZiAobmV4dExpbmUubWF0Y2goL15lbHNlXFx7JC8pKSB7XG4gICAgICAgICAgbGV0IGVuZGVsc2UgPSBmaW5kQ2xvc2luZ0JyYWNrZXQgKGVuZGlmICsgMSwgZW5kKTtcblxuICAgICAgICAgIG9wZXJhdGlvbi5lbHNlVHJlZSA9IGNsaXAoZW5kaWYgKyAyLCBlbmRlbHNlKTtcblxuICAgICAgICAgIHJlc3RhcnRBdCA9IGVuZGVsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpID0gcmVzdGFydEF0O1xuICAgICAgfVxuXG4gICAgICB0cmVlLnB1c2gob3BlcmF0aW9uKTtcbiAgICAgIHByb2dyYW0ud2VpZ2h0ICs9IDE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyZWU7XG4gIH1cblxuICBmdW5jdGlvbiBmaW5kQ2xvc2luZ0JyYWNrZXQgKHN0YXJ0LCBlbmQpIHtcbiAgICBsZXQgYnJhY2tldENvdW50ZXIgPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDw9IGVuZDsgaSArPSAxKSB7XG4gICAgICBsZXQgbGluZSA9IGxpbmVzW2ldO1xuXG4gICAgICBpZiAobGluZS5tYXRjaCgvXFx7LykpIHtcbiAgICAgICAgYnJhY2tldENvdW50ZXIgKz0gMTtcbiAgICAgIH1cbiAgICAgIGlmIChsaW5lLm1hdGNoKC9cXH0vKSkge1xuICAgICAgICBicmFja2V0Q291bnRlciAtPSAxO1xuICAgICAgfVxuICAgICAgaWYgKGJyYWNrZXRDb3VudGVyID09PSAwKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAnZXJyb3InO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9nRXJyb3IgKGxpbmUsIG1lc3NhZ2UpIHtcbiAgICBwcm9ncmFtLmxvZy5wdXNoKHtcbiAgICAgICdsaW5lJzogbGluZSxcbiAgICAgICdtZXNzYWdlJzogbWVzc2FnZVxuICAgIH0pO1xuICAgIHByb2dyYW0uc3RhdHVzID0gJ2Vycm9yJztcbiAgfVxuXG4gIHJldHVybiBwcm9ncmFtO1xufTtcblxuLy8gZnVuY3Rpb24gbm9ybWFsaXplQ29kZSAocmF3Q29kZSkge1xuLy8gICBsZXQgbm9ybWFsaXplZENvZGUgPSAnJztcbi8vXG4vLyAgIG5vcm1hbGl6ZWRDb2RlID0gcmF3Q29kZS5yZXBsYWNlKC9cXG5cXHMqfVxccyplbHNlXFxzKntcXHMqXFxuL2csICdcXG59XFxuZWxzZSB7XFxuJyk7XG4vL1xuLy8gICByZXR1cm4gbm9ybWFsaXplZENvZGU7XG4vLyB9XG4iLCJsZXQgZnMgPSByZXF1aXJlKCdmcycpO1xubGV0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5sZXQgdGVtcGxhdGUgPSByZXF1aXJlKCdhay10ZW1wbGF0ZScpO1xubGV0IGRlZmF1bHRzID0gcmVxdWlyZSgnc3RsdWFmZWQnKTtcblxubGV0IFZpZXcgPSByZXF1aXJlKCcuLi92aWV3Jyk7XG5sZXQgUHJvY2Vzc29yID0gcmVxdWlyZSgnLi9wcm9jZXNzb3InKTtcblxubGV0IG1vZHVsZXMgPSByZXF1aXJlKCcuL21vZHVsZXMnKTtcblxuLy8gaHR0cDovL3Nwcml0ZXNwYWNlLmJsb2dzcG90LmZyLzIwMTMvMTAvdG8tc3RhcnQtb2Ytd2l0aC1oZXJlLWFyZS1jb2xsZWN0aW9uLW9mLmh0bWxcbi8vIGh0dHA6Ly9nYW1lLWljb25zLm5ldC9cbi8vIGh0dHA6Ly9vcGVuZ2FtZWFydC5vcmcvc2l0ZXMvZGVmYXVsdC9maWxlcy9kdW5nZW9uX3ByZS5wbmcgKyBodHRwOi8vb3BlbmdhbWVhcnQub3JnL3NpdGVzL2RlZmF1bHQvZmlsZXMvZHVuZ2Vvbl90aWxlc18yLnBuZ1xuLy8gaHR0cDovL29wZW5nYW1lYXJ0Lm9yZy9jb250ZW50L2EtYmxvY2t5LWR1bmdlb25cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBVbml0IGV4dGVuZHMgVmlldyB7XG4gIGNvbnN0cnVjdG9yIChvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihvcHRpb25zKTtcblxuICAgIHRoaXMudGVtcGxhdGUgPSB0ZW1wbGF0ZShmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3RlbXBsYXRlcy91bml0LnRwbCcpLCAndXRmLTgnKSk7XG4gICAgdGhpcy5vcHRpb25zID0gZGVmYXVsdHMob3B0aW9ucywge1xuICAgICAgJ2V2ZW50cyc6IFtcbiAgICAgIF0sXG4gICAgICAndHlwZSc6ICdyb2JvdCcsXG4gICAgICAnbmFtZSc6ICdhbm9ueW1vdXMnLFxuICAgICAgJ2RpcmVjdGlvbic6ICd3ZXN0JyxcbiAgICAgICdmdWVsJzogMTAsXG4gICAgICAnbW9kdWxlcyc6IFtcbiAgICAgICAgJ3doZWVscydcbiAgICAgIF1cbiAgICB9KTtcblxuICAgIHRoaXMubWFwID0gb3B0aW9ucy5tYXA7XG4gICAgdGhpcy5wcm9ncmFtQ29udGV4dCA9IHt9O1xuICAgIHRoaXMucHJvY2Vzc29yID0gbmV3IFByb2Nlc3Nvcih7XG4gICAgICAncGFyZW50JzogdGhpc1xuICAgIH0pO1xuXG4gICAgZm9yIChsZXQgbW9kdWxlTmFtZSBvZiB0aGlzLm9wdGlvbnMubW9kdWxlcykge1xuICAgICAgdGhpcy5hZGRNb2R1bGUobW9kdWxlTmFtZSk7XG4gICAgfVxuICB9XG5cbiAgcnVuIChwcm9ncmFtKSB7XG4gICAgdGhpcy5wcm9jZXNzb3IucnVuKHByb2dyYW0pO1xuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICB0aGlzLmVtaXQoJ3JlbmRlcmluZycpO1xuICAgIHRoaXMucmVuZGVyVGVtcGxhdGUodGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLmVtaXQoJ3JlbmRlcicpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBhZGRNb2R1bGUgKG1vZHVsZSkge1xuICAgIGlmICghIG1vZHVsZXNbbW9kdWxlXSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgZmluZCBtb2R1bGUgXCIke21vZHVsZX1cImApO1xuICAgIH1cblxuICAgIHRoaXNbbW9kdWxlXSA9IG1vZHVsZXNbbW9kdWxlXSh0aGlzKTtcbiAgfVxuXG4gIHVzZUZ1ZWwgKGFtdCA9IDEpIHtcbiAgICBpZiAodGhpcy50eXBlID09PSAncm9ib3QnKSB7XG4gICAgICB0aGlzLmZ1ZWwgLT0gYW10O1xuICAgIH1cbiAgfVxuICBnZXQgZnVlbCAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5mdWVsO1xuICB9XG5cbiAgc2V0IGRpcmVjdGlvbiAoZGlyZWN0aW9uKSB7XG4gICAgdGhpcy5vcHRpb25zLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgfVxuICBnZXQgZGlyZWN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmRpcmVjdGlvbjtcbiAgfVxuICBzZXQgbmFtZSAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQXR0ZW1wdGluZyB0byBhc3NpZ24gJHtuYW1lfSB0byBuYW1lIHdoaWNoIGlzIGEgcmVhZCBvbmx5IHByb3BlcnR5YCk7XG4gIH1cbiAgZ2V0IG5hbWUgKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMubmFtZTtcbiAgfVxuICBzZXQgdHlwZSAodHlwZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQXR0ZW1wdGluZyB0byBhc3NpZ24gJHt0eXBlfSB0byB0eXBlIHdoaWNoIGlzIGEgcmVhZCBvbmx5IHByb3BlcnR5YCk7XG4gIH1cbiAgZ2V0IHR5cGUgKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMudHlwZTtcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAnbGVncyc6IHJlcXVpcmUoJy4vd2hlZWxzJyksXG4gICd3aGVlbHMnOiByZXF1aXJlKCcuL3doZWVscycpLFxuICAnc2Vuc29yJzogcmVxdWlyZSgnLi9zZW5zb3InKVxufTtcbiIsImxldCBkaXJlY3Rpb25zID0gcmVxdWlyZSgnLi4vLi4vZGlyZWN0aW9ucycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNlbnNvciAocGFyZW50KSB7XG4gIC8vbGV0IHNjYW5SYW5nZSA9IDE7XG4gIGxldCBpbmZvID0ge1xuICAgICdnZW5lcmFsJzoge1xuICAgICAgJ3N0YXR1cyc6ICdvaydcbiAgICB9LFxuICAgICdzY2FuJzoge1xuICAgICAgJ2R1cmF0aW9uJzogMjBcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICAnaW5mbyc6IChpbmZvTmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIGluZm9baW5mb05hbWVdO1xuICAgIH0sXG4gICAgJ3NjYW4nOiAoZGlyZWN0aW9uID0gJ2FoZWFkJykgPT4ge1xuICAgICAgbGV0IGFic29sdXRlRGlyZWN0aW9uID0gZGlyZWN0aW9ucy5nZXRBYnNvbHV0ZUZyb21SZWxhdGl2ZShwYXJlbnQuZGlyZWN0aW9uLCBkaXJlY3Rpb24pO1xuICAgICAgbGV0IGxvb2tBdCA9IGRpcmVjdGlvbnMuZ2V0TmV4dFRpbGVDb29yZGluYXRlcyhwYXJlbnQucG9zaXRpb24sIGFic29sdXRlRGlyZWN0aW9uKTtcbiAgICAgIGxldCB0aWxlID0gcGFyZW50Lm1hcC5zZWxlY3RUaWxlKGxvb2tBdCk7XG5cbiAgICAgIGlmICghIHRpbGUgfHwgdGlsZS50eXBlID09PSAnd2FsbCcpIHtcbiAgICAgICAgcmV0dXJuICdvYnN0YWNsZSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAnY2xlYXInO1xuICAgIH1cbiAgfTtcbn07XG4iLCJsZXQgZGlyZWN0aW9ucyA9IHJlcXVpcmUoJy4uLy4uL2RpcmVjdGlvbnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB3aGVlbHMgKHBhcmVudCkge1xuICBsZXQgaW5mbyA9IHtcbiAgICAnZ2VuZXJhbCc6IHtcbiAgICAgICdzdGF0dXMnOiAnb2snXG4gICAgfSxcbiAgICAndHVybic6IHtcbiAgICAgICdkdXJhdGlvbic6IDE1MFxuICAgIH0sXG4gICAgJ2ZvcndhcmQnOiB7XG4gICAgICAnZHVyYXRpb24nOiAzMDBcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICAnaW5mbyc6IChpbmZvTmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIGluZm9baW5mb05hbWVdO1xuICAgIH0sXG4gICAgJ3R1cm4nOiBmdW5jdGlvbiB0dXJuIChkaXJlY3Rpb24gPSAnY2xvY2snKSB7XG4gICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gZGlyZWN0aW9ucy5hYnNvbHV0ZS5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICBwYXJlbnQuZWwuY2xhc3NMaXN0LnJlbW92ZShgZHMtZGlyZWN0aW9uLSR7ZGlyZWN0aW9ucy5hYnNvbHV0ZVtpXX1gKTtcbiAgICAgIH1cblxuICAgICAgcGFyZW50LmRpcmVjdGlvbiA9IGRpcmVjdGlvbnMuZ2V0QWJzb2x1dGVGcm9tVHVybihwYXJlbnQuZGlyZWN0aW9uLCBkaXJlY3Rpb24pO1xuICAgICAgcGFyZW50LmVsLmNsYXNzTGlzdC5hZGQoYGRzLWRpcmVjdGlvbi0ke3BhcmVudC5kaXJlY3Rpb259YCk7XG5cbiAgICAgIHJldHVybiBwYXJlbnQ7XG4gICAgfSxcbiAgICAnZm9yd2FyZCc6IGZ1bmN0aW9uIGZvcndhcmQgKCkge1xuICAgICAgbGV0IG5ld0Nvb3JkaW5hdGVzID0gZGlyZWN0aW9ucy5nZXROZXh0VGlsZUNvb3JkaW5hdGVzKHBhcmVudC5wb3NpdGlvbiwgcGFyZW50LmRpcmVjdGlvbik7XG5cbiAgICAgIGlmIChwYXJlbnQuZnVlbCA8PSAwKSB7XG4gICAgICAgIHBhcmVudC5sb2coYCR7cGFyZW50Lm5hbWV9IHRoZSAke3BhcmVudC50eXBlfSBoYXMgbm8gbW9yZSBmdWVsLmApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHBhcmVudC51c2VGdWVsKCk7XG4gICAgICBwYXJlbnQuZW1pdCgndW5pdC5tb3ZlJywgcGFyZW50LCBuZXdDb29yZGluYXRlcyk7XG4gICAgfVxuICB9O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUHJvY2Vzc29yIHtcbiAgY29uc3RydWN0b3IgKG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMucGFyZW50ID0gb3B0aW9ucy5wYXJlbnQ7XG4gICAgdGhpcy5leGVjdXRpb25Mb2cgPSBbXTtcbiAgfVxuXG4gIHJ1biAocHJvZ3JhbSkge1xuICAgIGxldCBpID0gMDtcblxuICAgIGlmICghIHRoaXMucnVubmluZykge1xuICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcblxuICAgICAgdGhpcy5sb2coJ1Byb2dyYW0gc3RhcnRpbmcgZnJvbSB0aGUgdG9wJyk7XG5cbiAgICAgIHRoaXMubmV4dExpbmUocHJvZ3JhbSwgaSwgKCkgPT4ge1xuICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5ydW4ocHJvZ3JhbSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBuZXh0TGluZSAocHJvZ3JhbSwgaSwgY2FsbGJhY2spIHtcbiAgICBpZiAoISB0aGlzLnJ1bm5pbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgbGluZSA9IHByb2dyYW1baV07XG4gICAgbGV0IGxpbmVUeXBlID0gbGluZS50eXBlO1xuICAgIGxldCBsYXN0ID0gaSArIDEgPT09IHByb2dyYW0ubGVuZ3RoO1xuXG4gICAgbGV0IG5leHRDb250ZW50ID0gdGhpcy5uZXh0TGluZS5iaW5kKHRoaXMsIHByb2dyYW0sIGkgKyAxLCBjYWxsYmFjayk7XG5cbiAgICBpZiAobGFzdCkge1xuICAgICAgbmV4dENvbnRlbnQgPSBjYWxsYmFjaztcbiAgICB9XG5cbiAgICBsZXQgbmV4dCA9IGZ1bmN0aW9uIG5leHQgKGRlbGF5ID0gMCkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiBleGVjICgpIHtcbiAgICAgICAgbmV4dENvbnRlbnQoKTtcbiAgICAgIH0sIGRlbGF5KTtcbiAgICB9O1xuXG4gICAgaWYgKGxpbmVUeXBlID09PSAnYXNzaWduJykge1xuICAgICAgLy90aGlzW3Byb2dyYW1baV1dICYmIHRoaXNbcHJvZ3JhbVtpXV0oKTtcbiAgICAgIG5leHQoKTtcbiAgICB9XG4gICAgaWYgKGxpbmVUeXBlID09PSAnaWYnKSB7XG4gICAgICBpZiAodGhpcy50ZXN0Q29uZGl0aW9uKGxpbmUuY29uZGl0aW9uKSkge1xuICAgICAgICB0aGlzLm5leHRMaW5lKGxpbmUuc3ViVHJlZSwgMCwgbmV4dCk7XG4gICAgICB9IGVsc2UgaWYgKGxpbmUuZWxzZVRyZWUpIHtcbiAgICAgICAgdGhpcy5uZXh0TGluZShsaW5lLmVsc2VUcmVlLCAwLCBuZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHQoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGxpbmVUeXBlID09PSAnY2FsbCcpIHtcbiAgICAgIGxldCBtZXRob2RJbmZvID0gdGhpcy5leGVjQ2FsbChwcm9ncmFtW2ldKTtcblxuICAgICAgbmV4dChtZXRob2RJbmZvLmluZm8uZHVyYXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIGV4ZWNDYWxsIChjYWxsKSB7XG4gICAgbGV0IG1ldGhvZFBhdGggPSBjYWxsLm1ldGhvZDtcbiAgICBsZXQgbWV0aG9kSW5mbyA9IHt9O1xuICAgIGxldCBtZXRob2RDb250ZXh0ID0gJ3Byb2dyYW1Db250ZXh0JztcbiAgICBsZXQgbWV0aG9kTmFtZSA9ICcnO1xuICAgIGxldCBwYXJhbWV0ZXJzID0gW107XG5cbiAgICBpZiAobWV0aG9kUGF0aC5sZW5ndGggPT09IDEpIHtcbiAgICAgIG1ldGhvZE5hbWUgPSBtZXRob2RQYXRoWzBdO1xuICAgIH1cbiAgICBpZiAobWV0aG9kUGF0aC5sZW5ndGggPT09IDIpIHtcbiAgICAgIG1ldGhvZENvbnRleHQgPSBtZXRob2RQYXRoWzBdO1xuICAgICAgbWV0aG9kTmFtZSA9IG1ldGhvZFBhdGhbMV07XG4gICAgfVxuXG4gICAgaWYgKCEgdGhpcy5wYXJlbnRbbWV0aG9kQ29udGV4dF0gfHwgISB0aGlzLnBhcmVudFttZXRob2RDb250ZXh0XVttZXRob2ROYW1lXSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMucGFyZW50Lm5hbWV9IHRoZSAke3RoaXMucGFyZW50LnR5cGV9IGNhbm5vdCBydW4gXCIke21ldGhvZFBhdGguam9pbignLicpfSgke3BhcmFtZXRlcnN9KVwiYCk7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGNhbGwuYXJndW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICBwYXJhbWV0ZXJzLnB1c2godGhpcy5nZXRBcmd1bWVudFZhbHVlKGNhbGwuYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuXG4gICAgLy9nZXQgaW5mbyBmcm9tIG1vZHVsZVxuICAgIG1ldGhvZEluZm8gPSB0aGlzLnBhcmVudFttZXRob2RDb250ZXh0XS5pbmZvICYmIHRoaXMucGFyZW50W21ldGhvZENvbnRleHRdLmluZm8obWV0aG9kTmFtZSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgJ3JldHVybic6IHRoaXMucGFyZW50W21ldGhvZENvbnRleHRdW21ldGhvZE5hbWVdLmFwcGx5KHRoaXMucGFyZW50LCBwYXJhbWV0ZXJzKSxcbiAgICAgICdpbmZvJzogbWV0aG9kSW5mb1xuICAgIH07XG4gIH1cblxuICB0ZXN0Q29uZGl0aW9uIChjb25kaXRpb24pIHtcbiAgICBpZiAoY29uZGl0aW9uLm9wZXJhdG9yID09PSAnZXF1YWxzJykge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0QXJndW1lbnRWYWx1ZShjb25kaXRpb24uYSkgPT09IHRoaXMuZ2V0QXJndW1lbnRWYWx1ZShjb25kaXRpb24uYik7XG4gICAgfVxuICAgIGlmIChjb25kaXRpb24ub3BlcmF0b3IgPT09ICdub3RlcXVhbHMnKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRBcmd1bWVudFZhbHVlKGNvbmRpdGlvbi5hKSAhPT0gdGhpcy5nZXRBcmd1bWVudFZhbHVlKGNvbmRpdGlvbi5iKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZ2V0QXJndW1lbnRWYWx1ZSAoYXJnKSB7XG4gICAgaWYgKGFyZy50eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGFyZy52YWx1ZTtcbiAgICB9XG4gICAgaWYgKGFyZy50eXBlID09PSAnY2FsbCcpIHtcbiAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXhlY0NhbGwoYXJnKTtcblxuICAgICAgcmV0dXJuIHZhbHVlLnJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBsb2cgKHRleHQpIHtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4gICAgY29uc29sZS5sb2codGV4dCk7XG4gICAgdGhpcy5leGVjdXRpb25Mb2cucHVzaCh0ZXh0KTtcbiAgfVxufTtcbiIsImxldCBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdhay1ldmVudGVtaXR0ZXInKTtcbmxldCBEb21EZWxlZ2F0ZSA9IHJlcXVpcmUoJy4vZG9tLWRlbGVnYXRlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVmlldyBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yIChvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihvcHRpb25zKTtcblxuICAgIHRoaXMuZXZlbnRzID0ge307XG4gICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcbiAgICB0aGlzLmRlbGVnYXRlID0gbnVsbDtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIHZpZXcncyBtYWluIERPTSBlbGVtZW50XG4gICAqXG4gICAqIEByZXR1cm4ge0VsZW1lbnR9XG4gICAqL1xuICBnZXQgZWwgKCkge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogYmluZCBldmVudHMgdG8gdGhlIHZpZXcncyBtYWluIERPTSBlbGVtZW50XG4gICAqXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBpZiB2aWV3IGhhcyBub3QgYmVlbiByZW5kZXJlZFxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5PFZpZXdFdmVudD59IFtldmVudHNdXG4gICAqIEByZXR1cm4ge1ZpZXd9XG4gICAqL1xuICBiaW5kIChldmVudHMgPSB0aGlzLm9wdGlvbnMuZXZlbnRzKSB7XG4gICAgaWYgKCEgdGhpcy5lbGVtZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZpZXcgaGFzIG5vdCBiZWVuIHJlbmRlcmVkIHlldC4nKTtcbiAgICB9XG5cbiAgICBpZiAoISBldmVudHMpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8vV2lsbCB0cnkgdG8gdW5iaW5kIGV2ZW50cyBmaXJzdCwgdG8gYXZvaWQgZHVwbGljYXRlc1xuICAgIHRoaXMudW5iaW5kKGV2ZW50cyk7XG4gICAgdGhpcy5oYW5kbGVFdmVudHMoJ29uJywgZXZlbnRzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIHVuYmluZCBldmVudHMgZnJvbSB0aGUgdmlldydzIG1haW4gRE9NIGVsZW1lbnRcbiAgICpcbiAgICogQHRocm93cyBFcnJvciAtIGlmIHZpZXcgaGFzIG5vdCBiZWVuIHJlbmRlcmVkXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXk8Vmlld0V2ZW50Pn0gW2V2ZW50c11cbiAgICogQHJldHVybiB7Vmlld31cbiAgICovXG4gIHVuYmluZCAoZXZlbnRzID0gdGhpcy5vcHRpb25zLmV2ZW50cykge1xuICAgIGlmICghIHRoaXMuZWxlbWVudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdWaWV3IGhhcyBub3QgYmVlbiByZW5kZXJlZCB5ZXQuJyk7XG4gICAgfVxuXG4gICAgaWYgKCEgZXZlbnRzKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlLm9mZigpO1xuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB0aGlzLmhhbmRsZUV2ZW50cygnb2ZmJywgZXZlbnRzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRlbXBsYXRlIHJlbmRlcmluZ1xuICAgKlxuICAgKiBAcGFyYW0gIHtPYmplY3R9IGRhdGEgLSBkYXRhIHRvIGRpc3BsYXlcbiAgICogQHJldHVybiB7V2lkZ2V0Vmlld31cbiAgICovXG4gIHJlbmRlclRlbXBsYXRlIChkYXRhKSB7XG4gICAgLy9XaWxsIGFsd2F5cyB1bmJpbmQgYmVmb3JlIHJlbmRlcmluZyBpZiBtYWluIGVsZW1lbnQgaXMgYWxyZWFkeSBzZXQuXG4gICAgaWYgKHRoaXMuZWxlbWVudCkge1xuICAgICAgdGhpcy51bmJpbmQoKTtcbiAgICAgIHRoaXMuZGVsZWdhdGUuZGVzdHJveSgpO1xuICAgIH1cblxuICAgIGlmICghIHRoaXMudGVtcGxhdGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBgdGhpcy50ZW1wbGF0ZWAnKTtcbiAgICB9XG5cbiAgICAvL09ubHkgdGFrZXMgdGhlIGZpcnN0IGNoaWxkIGVsZW1lbnQgb2YgdGhlIHRlbXBsYXRlLlxuICAgIHRoaXMuZWxlbWVudCA9IHRoaXMuZG9taWZ5KHRoaXMudGVtcGxhdGUoZGF0YSB8fCB7fSkpO1xuICAgIHRoaXMuZGVsZWdhdGUgPSBuZXcgRG9tRGVsZWdhdGUodGhpcy5lbGVtZW50KTtcblxuICAgIHRoaXMuYmluZCgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogcmVuZGVyIHRoZSB0ZW1wbGF0ZSAocHJveHkgZm9yIGAjcmVuZGVyVGVtcGxhdGUoKWApXG4gICAqXG4gICAqIEBzZWUgI3JlbmRlclRlbXBsYXRlKClcbiAgICogQGV2ZW50IHJlbmRlcmluZyAtIGJlZm9yZSByZW5kZXJpbmdcbiAgICogQGV2ZW50IHJlbmRlciAtIGFmdGVyIHJlbmRlclxuICAgKlxuICAgKiBAcmV0dXJuIHtWaWV3fVxuICAgKi9cbiAgcmVuZGVyICgpIHtcbiAgICB0aGlzLmVtaXQoJ3JlbmRlcmluZycpO1xuICAgIHRoaXMucmVuZGVyVGVtcGxhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB0aGlzLmVtaXQoJ3JlbmRlcicpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkb21pZnkgKHN0cikge1xuICAgIGxldCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgIGRpdi5pbm5lckhUTUwgPSBzdHI7XG5cbiAgICByZXR1cm4gZGl2LmZpcnN0RWxlbWVudENoaWxkO1xuICB9XG5cbiAgaGFuZGxlRXZlbnRzIChhY3Rpb24sIGV2ZW50cykge1xuICAgIGxldCBldmVudDtcbiAgICBsZXQgc2VsZWN0b3I7XG4gICAgbGV0IGNhbGxiYWNrO1xuICAgIGxldCBjb250ZXh0O1xuICAgIGxldCBzY29wZTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBldmVudHMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgIHNjb3BlID0gZXZlbnRzW2ldO1xuICAgICAgZXZlbnQgPSBzY29wZVswXTtcbiAgICAgIHNlbGVjdG9yID0gc2NvcGVbMl0gPyBzY29wZVsxXSA6IG51bGw7XG4gICAgICBjYWxsYmFjayA9IHNjb3BlWzJdID8gc2NvcGVbMl0gOiBzY29wZVsxXTtcbiAgICAgIGNvbnRleHQgPSBudWxsO1xuXG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiB0aGlzW2NhbGxiYWNrXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjYWxsYmFjayA9IHRoaXNbY2FsbGJhY2tdO1xuICAgICAgICAvKmVzbGludCBjb25zaXN0ZW50LXRoaXM6IDAqL1xuICAgICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY2FsbGJhY2sgZm9yIGV2ZW50IFsnICsgZXZlbnQgKyAnLCAnICsgc2VsZWN0b3IgKyAnLCAnICsgY2FsbGJhY2spO1xuICAgICAgfVxuXG4gICAgICBpZiAoISBzZWxlY3Rvcikge1xuICAgICAgICB0aGlzLmRlbGVnYXRlW2FjdGlvbl0oZXZlbnQsICcnLCBjYWxsYmFjaywgY29udGV4dCk7XG5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHNlbGVjdG9yID0gQXJyYXkuaXNBcnJheShzZWxlY3RvcikgPyBzZWxlY3RvciA6IFtzZWxlY3Rvcl07XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgc2VsZWN0b3IubGVuZ3RoOyBqICs9IDEpIHtcbiAgICAgICAgdGhpcy5kZWxlZ2F0ZVthY3Rpb25dKGV2ZW50LCBzZWxlY3RvcltqXSwgY2FsbGJhY2ssIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcbiIsImxldCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5sZXQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmxldCB0ZW1wbGF0ZSA9IHJlcXVpcmUoJ2FrLXRlbXBsYXRlJyk7XG5sZXQgZGVmYXVsdHMgPSByZXF1aXJlKCdzdGx1YWZlZCcpO1xuXG5sZXQgVmlldyA9IHJlcXVpcmUoJy4uL3ZpZXcnKTtcbmxldCBNYXAgPSByZXF1aXJlKCcuL21hcCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIE1haW5WaWV3IGV4dGVuZHMgVmlldyB7XG4gIGNvbnN0cnVjdG9yIChvcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihvcHRpb25zKTtcblxuICAgIHRoaXMudGVtcGxhdGUgPSB0ZW1wbGF0ZShmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3RlbXBsYXRlcy9tYWluLXZpZXcudHBsJyksICd1dGYtOCcpKTtcbiAgICB0aGlzLmxpbmVOdW1iZXJUZW1wbGF0ZSA9IHRlbXBsYXRlKGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdGVtcGxhdGVzL2xpbmUtbnVtYmVyLnRwbCcpLCAndXRmLTgnKSk7XG4gICAgdGhpcy5vcHRpb25zID0gZGVmYXVsdHMob3B0aW9ucywge1xuICAgICAgJ2V2ZW50cyc6IFtcbiAgICAgICAgWydjbGljaycsICcuZHMtcnVuJywgJ29uUnVuQ2xpY2snXSxcbiAgICAgICAgWydrZXlwcmVzcycsICcjZHMtZWRpdG9yLWlucHV0JywgJ29uRW50ZXInXVxuICAgICAgXVxuICAgIH0pO1xuXG4gICAgdGhpcy5tYXAgPSBuZXcgTWFwKHtcbiAgICAgICdtYXAnOiB0aGlzLm9wdGlvbnMubWFwXG4gICAgfSk7XG5cbiAgICB0aGlzLm1hcC5vbignbWFwLndhbGsudmljdG9yeScsICgpID0+IHtcbiAgICAgIHRoaXMuZW1pdCgnZ2FtZS52aWN0b3J5Jyk7XG4gICAgfSk7XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIHRoaXMuZW1pdCgncmVuZGVyaW5nJyk7XG4gICAgdGhpcy5yZW5kZXJUZW1wbGF0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgbGV0IG1hcFBhbmVsID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcjZHMtbWFwLXBhbmVsJyk7XG5cbiAgICBtYXBQYW5lbC5hcHBlbmRDaGlsZCh0aGlzLm1hcC5yZW5kZXIoKS5lbCk7XG5cbiAgICB0aGlzLnJ1bkJ1dHRvbiA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLmRzLXJ1bicpO1xuICAgIHRoaXMuZWRpdG9yID0ge1xuICAgICAgJ251bWJlcnMnOiB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJyNkcy1lZGl0b3ItbGluZS1udW1iZXJzJyksXG4gICAgICAnaW5wdXQnOiB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJyNkcy1lZGl0b3ItaW5wdXQnKVxuICAgIH07XG5cbiAgICB0aGlzLmVkaXRvci5pbnB1dC52YWx1ZSA9IGBpZiAoc2Vuc29yLnNjYW4oJ3JpZ2h0JykgPT0gJ2NsZWFyJykge1xuIGxlZ3MudHVybigncmlnaHQnKVxufVxuaWYgKHNlbnNvci5zY2FuKCdhaGVhZCcpID09ICdjbGVhcicpIHtcbiBsZWdzLmZvcndhcmQoKVxufVxuZWxzZSB7XG4gaWYoc2Vuc29yLnNjYW4oJ2xlZnQnKSA9PSAnY2xlYXInKSB7XG4gIGxlZ3MudHVybignbGVmdCcpXG4gfVxuIGVsc2Uge1xuICBsZWdzLnR1cm4oJ3JpZ2h0JylcbiB9XG59XG5gO1xuXG4gICAgdGhpcy5vbkVudGVyKCk7XG5cbiAgICB0aGlzLmVtaXQoJ3JlbmRlcicpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW5kZXJQYXJzaW5nTG9nIChsb2cpIHtcbiAgICBsZXQgbGluZU51bWJlcnMgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5kcy1lZGl0b3ItbGluZS1udW1iZXInKTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBsaW5lTnVtYmVycy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgbGluZU51bWJlcnNbaV0uY2xhc3NMaXN0LnJlbW92ZSgnZHMtcGFyc2luZy1lcnJvcicpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBsb2cubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgIGxldCBkaXNwbGF5ZWROdW1iZXIgPSBsb2dbaV0ubGluZSArIDE7XG4gICAgICBsZXQgbGluZU51bWJlciA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcihgLmRzLWVkaXRvci1saW5lLW51bWJlcltkYXRhLWxpbmUtbnVtYmVyPVwiJHtkaXNwbGF5ZWROdW1iZXJ9XCJdYCk7XG5cbiAgICAgIGlmICghIGxpbmVOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsaW5lTnVtYmVyLmNsYXNzTGlzdC5hZGQoJ2RzLXBhcnNpbmctZXJyb3InKTtcbiAgICAgIGxpbmVOdW1iZXIudGl0bGUgPSBsb2dbaV0ubWVzc2FnZTtcbiAgICB9XG4gIH1cblxuICBvblJ1bkNsaWNrICgpIHtcbiAgICBsZXQgcmF3Q29kZSA9IHRoaXMuZWRpdG9yLmlucHV0LnZhbHVlO1xuXG4gICAgdGhpcy5lbWl0KCdwcm9ncmFtLnJ1bicsIHJhd0NvZGUpO1xuICB9XG5cbiAgb25FbnRlciAoKSB7XG4gICAgbGV0IGxpbmVDb3VudCA9IHRoaXMuZWRpdG9yLmlucHV0LnZhbHVlLnNwbGl0KCdcXG4nKS5sZW5ndGg7XG4gICAgbGV0IGxpbmVOdW1iZXJzSHRtbCA9ICcnO1xuXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbGluZUNvdW50ICsgMTsgaSArPSAxKSB7XG4gICAgICBsaW5lTnVtYmVyc0h0bWwgKz0gdGhpcy5saW5lTnVtYmVyVGVtcGxhdGUoeydudW1iZXInOiBpfSk7XG4gICAgfVxuXG4gICAgdGhpcy5lZGl0b3IuaW5wdXQucm93cyA9IGxpbmVDb3VudCArIDM7XG4gICAgdGhpcy5lZGl0b3IubnVtYmVycy5pbm5lckhUTUwgPSBsaW5lTnVtYmVyc0h0bWw7XG4gIH1cbn07XG4iLCJsZXQgZnMgPSByZXF1aXJlKCdmcycpO1xubGV0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5sZXQgdGVtcGxhdGUgPSByZXF1aXJlKCdhay10ZW1wbGF0ZScpO1xubGV0IGRlZmF1bHRzID0gcmVxdWlyZSgnc3RsdWFmZWQnKTtcblxubGV0IFZpZXcgPSByZXF1aXJlKCcuLi92aWV3Jyk7XG5cbmxldCBtYXBzID0gcmVxdWlyZSgnLi4vbWFwcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIE1hcCBleHRlbmRzIFZpZXcge1xuICBjb25zdHJ1Y3RvciAob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIob3B0aW9ucyk7XG5cbiAgICB0aGlzLnRlbXBsYXRlID0gdGVtcGxhdGUoZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi90ZW1wbGF0ZXMvbWFwLnRwbCcpLCAndXRmLTgnKSk7XG4gICAgdGhpcy5tYXBUaWxlVGVtcGxhdGUgPSB0ZW1wbGF0ZShmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3RlbXBsYXRlcy9tYXAtdGlsZS50cGwnKSwgJ3V0Zi04JykpO1xuXG4gICAgdGhpcy5vcHRpb25zID0gZGVmYXVsdHMob3B0aW9ucywge1xuICAgICAgJ2V2ZW50cyc6IFtdLFxuICAgICAgJ21hcCc6IG1hcHNbMF1cbiAgICB9KTtcblxuICAgIHRoaXMubWFwID0gdGhpcy5pbml0TWFwKG9wdGlvbnMubWFwKTtcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgdGhpcy5lbWl0KCdyZW5kZXJpbmcnKTtcbiAgICB0aGlzLnJlbmRlclRlbXBsYXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICBsZXQgbWFwSHRtbCA9ICcnO1xuXG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPCB0aGlzLm1hcC5sZW5ndGg7IHkgKz0gMSkge1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLm1hcFt5XS5sZW5ndGg7IHggKz0gMSkge1xuICAgICAgICBtYXBIdG1sICs9IHRoaXMubWFwVGlsZVRlbXBsYXRlKHRoaXMubWFwW3ldW3hdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmVsLmlubmVySFRNTCA9IG1hcEh0bWw7XG4gICAgdGhpcy5zYXZlVGlsZUVsZW1lbnRzKCk7XG5cbiAgICB0aGlzLmVtaXQoJ3JlbmRlcicpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBpbml0TWFwIChwbGFuKSB7XG4gICAgbGV0IG1hcCA9IFtdO1xuXG4gICAgcGxhbiA9IHBsYW4uc3BsaXQoJ1xcbicpO1xuXG4gICAgZm9yIChsZXQgeSA9IDAsIHlsZW4gPSBwbGFuLmxlbmd0aDsgeSA8IHlsZW47IHkgKz0gMSkge1xuICAgICAgbGV0IHJvdyA9IHBsYW5beV0uc3BsaXQoJycpO1xuXG4gICAgICBtYXAucHVzaChbXSk7XG5cbiAgICAgIGZvciAobGV0IHggPSAwLCB4bGVuID0gcm93Lmxlbmd0aDsgeCA8IHhsZW47IHggKz0gMSkge1xuICAgICAgICBsZXQgdGlsZSA9IHtcbiAgICAgICAgICAneCc6IHgsXG4gICAgICAgICAgJ3knOiB5LFxuICAgICAgICAgICd0eXBlJzogJ2Zsb29yJ1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChwbGFuW3ldW3hdID09PSAnVycpIHtcbiAgICAgICAgICB0aWxlLnR5cGUgPSAnd2FsbCc7XG4gICAgICAgICAgdGlsZS5pbWdDbGFzcyA9IHBsYW5beV1beF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBsYW5beV1beF0gPT09ICdWJykge1xuICAgICAgICAgIHRpbGUudHlwZSA9ICd2aWN0b3J5JztcbiAgICAgICAgICB0aWxlLmltZ0NsYXNzID0gJ3ZpY3RvcnknO1xuICAgICAgICB9XG5cbiAgICAgICAgbWFwW3ldLnB1c2godGlsZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hcDtcbiAgfVxuICBzYXZlVGlsZUVsZW1lbnRzICgpIHtcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRoaXMubWFwLmxlbmd0aDsgeSArPSAxKSB7XG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMubWFwW3ldLmxlbmd0aDsgeCArPSAxKSB7XG4gICAgICAgIGxldCBzZWxlY3RvciA9IGAuZHMtbWFwLXRpbGVbZGF0YS1wb3NpdGlvbi14PVwiJHt4fVwiXVtkYXRhLXBvc2l0aW9uLXk9XCIke3l9XCJdYDtcblxuICAgICAgICB0aGlzLm1hcFt5XVt4XS5lbCA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHNlbGVjdFRpbGUgKGNvb3JkaW5hdGVzKSB7XG4gICAgaWYgKCEgY29vcmRpbmF0ZXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gY29vcmRpbmF0ZXMgcHJvdmlkZWQgZm9yIHNlbGVjdFRpbGUnKTtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XG5cbiAgICByZXN1bHQgPSB0aGlzLm1hcFtjb29yZGluYXRlcy55XSAmJiB0aGlzLm1hcFtjb29yZGluYXRlcy55XVtjb29yZGluYXRlcy54XTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZHJhd1VuaXQgKHVuaXQpIHtcbiAgICBsZXQgdGlsZSA9IHRoaXMuc2VsZWN0VGlsZSh1bml0LnBvc2l0aW9uKTtcblxuICAgIGlmICh1bml0LmVsKSB7XG4gICAgICB1bml0LmVsLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQodW5pdC5lbCk7XG4gICAgfVxuICAgIGlmICghIHVuaXQuZWwpIHtcbiAgICAgIHVuaXQucmVuZGVyKCk7XG4gICAgfVxuXG4gICAgdGlsZS5lbC5hcHBlbmRDaGlsZCh1bml0LmVsKTtcbiAgfVxuXG4gIG1vdmVVbml0ICh1bml0LCBjb29yZGluYXRlcykge1xuICAgIGxldCB0aWxlID0gdGhpcy5zZWxlY3RUaWxlKGNvb3JkaW5hdGVzKTtcblxuICAgIGlmICh0aWxlICYmIHRpbGUudHlwZSAhPT0gJ3dhbGwnKSB7XG4gICAgICB1bml0LnBvc2l0aW9uID0gY29vcmRpbmF0ZXM7XG4gICAgICB0aGlzLmRyYXdVbml0KHVuaXQpO1xuXG4gICAgICBpZiAodGlsZS50eXBlID09PSAndmljdG9yeScpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdtYXAud2Fsay52aWN0b3J5Jyk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHVuaXQucHJvY2Vzc29yLmxvZygnbW92ZSBkaXNhbGxvd2VkJyk7XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL2V2ZW50ZW1pdHRlcicpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEV4cG9ydCBgRXZlbnRFbWl0dGVyYFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChvcHRpb25hbClcbiAqIEByZXR1cm4ge0V2ZW50RW1pdHRlcn1cbiAqL1xudmFyIEV2ZW50RW1pdHRlciA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHRoaXMuX2V2ZW50RW1pdHRlciA9IHt9O1xuICB0aGlzLl9ldmVudEVtaXR0ZXIudHJlZSA9IHsnY2hpbGRyZW4nOiB7fX07XG4gIHRoaXMuX2V2ZW50RW1pdHRlci5kZWxpbWl0ZXIgPSBvcHRpb25zLmRlbGltaXRlciB8fCAnLic7XG59O1xuXG4vKipcbiAqIENhbGwgYWxsIGNhbGxiYWNrcyBmb3IgZ2l2ZW4gdHJlZVxuICpcbiAqIEBzZWUgI19zZWFyY2hUcmVlKCk7XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHRyZWVcbiAqIEBwYXJhbSB7YXJndW1lbnRzfSBhcmdzXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2VtaXQgPSBmdW5jdGlvbiAodHJlZSwgYXJncykge1xuICB2YXIgY2FsbGJhY2tzID0gdHJlZS5jYWxsYmFja3M7XG5cbiAgaWYgKCEgY2FsbGJhY2tzKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB2YXIgYXJnYyA9IGFyZ3MubGVuZ3RoO1xuXG4gIGZvciAoXG4gICAgdmFyIGkgPSAwLFxuICAgIGxlbiA9IGNhbGxiYWNrcy5sZW5ndGgsXG4gICAgY2FsbGJhY2s7XG4gICAgaSA8IGxlbjtcbiAgICBpICs9IDFcbiAgKSB7XG4gICAgY2FsbGJhY2sgPSBjYWxsYmFja3NbaV07XG5cbiAgICBpZiAoYXJnYyA9PT0gMSkge1xuICAgICAgY2FsbGJhY2suZm4uY2FsbChjYWxsYmFjay5jb250ZXh0LCBhcmdzWzBdKTtcbiAgICB9IGVsc2UgaWYgKGFyZ2MgPT09IDIpIHtcbiAgICAgIGNhbGxiYWNrLmZuLmNhbGwoY2FsbGJhY2suY29udGV4dCwgYXJnc1swXSwgYXJnc1sxXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrLmZuLmFwcGx5KGNhbGxiYWNrLmNvbnRleHQsIGFyZ3MpO1xuICAgIH1cblxuICAgIGlmIChjYWxsYmFjay5vbmNlKSB7XG4gICAgICBjYWxsYmFja3Muc3BsaWNlKGksIDEpO1xuXG4gICAgICBpIC09IDE7XG4gICAgICBsZW4gLT0gMTtcblxuICAgICAgaWYgKGNhbGxiYWNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdHJlZS5jYWxsYmFja3MgPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFBhcnNlIGdpdmVuIHRyZWUgZm9yIGdpdmVuIG5zXG4gKlxuICogQHNlZSAjZW1pdCgpO1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB0cmVlXG4gKiBAcGFyYW0ge0FycmF5fSBuc1xuICogQHBhcmFtIHtJbnRlZ2VyfSBzdGFydFxuICogQHBhcmFtIHthcmd1bWVudHN9IGFyZ3NcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fc2VhcmNoVHJlZSA9IGZ1bmN0aW9uICh0cmVlLCBucywgc3RhcnQsIGFyZ3MpIHtcbiAgZm9yICh2YXIgaSA9IHN0YXJ0LFxuICAgIGxlbiA9IG5zLmxlbmd0aCxcbiAgICBjdXJyZW50TnMsXG4gICAgY3VycmVudFRyZWUsXG4gICAgd2lsZFRyZWU7XG4gICAgaSA8IGxlbjtcbiAgICBpICs9IDFcbiAgKSB7XG4gICAgd2lsZFRyZWUgPSB0cmVlLmNoaWxkcmVuWycqJ107XG5cbiAgICBpZiAod2lsZFRyZWUpIHtcbiAgICAgIGlmICh3aWxkVHJlZS5jYWxsYmFja3MpIHtcbiAgICAgICAgdGhpcy5fZW1pdCh3aWxkVHJlZSwgYXJncyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3NlYXJjaFRyZWUod2lsZFRyZWUsIG5zLCBpICsgMSwgYXJncyk7XG4gICAgfVxuXG4gICAgY3VycmVudE5zID0gbnNbaV07XG4gICAgY3VycmVudFRyZWUgPSB0cmVlLmNoaWxkcmVuW2N1cnJlbnROc107XG5cbiAgICBpZiAoISBjdXJyZW50VHJlZSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdHJlZSA9IGN1cnJlbnRUcmVlO1xuICB9XG5cbiAgaWYgKGN1cnJlbnRUcmVlKSB7XG4gICAgdGhpcy5fZW1pdChjdXJyZW50VHJlZSwgYXJncyk7XG4gIH1cbn07XG5cbi8qKlxuICogQWRkIGV2ZW50IGxpc3RlbmVyXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKG9wdGlvbmFsKVxuICogQHJldHVybiB7RXZlbnRFbWl0dGVyfVxuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKG5zLCBjYWxsYmFjaywgY29udGV4dCwgb25jZSkge1xuICBucyA9IG5zLnNwbGl0KHRoaXMuX2V2ZW50RW1pdHRlci5kZWxpbWl0ZXIpO1xuICB2YXIgdHJlZSA9IHRoaXMuX2V2ZW50RW1pdHRlci50cmVlO1xuICB2YXIgY3VycmVudE5zO1xuICB2YXIgY3VycmVudFRyZWU7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IG5zLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgY3VycmVudE5zID0gbnNbaV07XG4gICAgY3VycmVudFRyZWUgPSB0cmVlLmNoaWxkcmVuW2N1cnJlbnROc107XG5cbiAgICBpZiAoISBjdXJyZW50VHJlZSkge1xuICAgICAgY3VycmVudFRyZWUgPSB0cmVlLmNoaWxkcmVuW2N1cnJlbnROc10gPSB7J2NoaWxkcmVuJzoge319O1xuICAgIH1cblxuICAgIHRyZWUgPSBjdXJyZW50VHJlZTtcbiAgfVxuXG4gIGlmICghIHRyZWUuY2FsbGJhY2tzKSB7XG4gICAgdHJlZS5jYWxsYmFja3MgPSBbXTtcbiAgfVxuXG4gIHRyZWUuY2FsbGJhY2tzLnB1c2goe1xuICAgICdmbic6IGNhbGxiYWNrLFxuICAgICdjb250ZXh0JzogY29udGV4dCA/IGNvbnRleHQgOiB0aGlzLFxuICAgICdvbmNlJzogISEgb25jZVxuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGV2ZW50IGxpc3RlbmVyXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKG9wdGlvbmFsKVxuICogQHJldHVybiB7RXZlbnRFbWl0dGVyfVxuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uIChucywgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgaWYgKCEgbnMpIHtcbiAgICB0aGlzLl9ldmVudEVtaXR0ZXIudHJlZSA9IHsnY2hpbGRyZW4nOiB7fX07XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG5zID0gbnMuc3BsaXQodGhpcy5fZXZlbnRFbWl0dGVyLmRlbGltaXRlcik7XG4gIHZhciB0cmVlID0gdGhpcy5fZXZlbnRFbWl0dGVyLnRyZWU7XG4gIHZhciBjdXJyZW50VHJlZTtcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gbnMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICBjdXJyZW50VHJlZSA9IHRyZWUuY2hpbGRyZW5bbnNbaV1dO1xuXG4gICAgaWYgKCEgY3VycmVudFRyZWUpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHRyZWUgPSBjdXJyZW50VHJlZTtcbiAgfVxuXG4gIGlmICghIGNhbGxiYWNrKSB7XG4gICAgdHJlZS5jYWxsYmFja3MgPSB1bmRlZmluZWQ7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGlmICghIHRyZWUuY2FsbGJhY2tzKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBmb3IgKFxuICAgIHZhciBpMiA9IDAsXG4gICAgY2FsbGJhY2tzID0gdHJlZS5jYWxsYmFja3MsXG4gICAgbGVuMiA9IGNhbGxiYWNrcy5sZW5ndGgsXG4gICAgY3VycmVudENhbGxiYWNrO1xuICAgIGkyIDwgbGVuMjtcbiAgICBpMiArPSAxXG4gICkge1xuICAgIGN1cnJlbnRDYWxsYmFjayA9IGNhbGxiYWNrc1tpMl07XG5cbiAgICBpZiAoY3VycmVudENhbGxiYWNrLmZuID09PSBjYWxsYmFjaykge1xuICAgICAgaWYgKGNvbnRleHQgJiYgY29udGV4dCAhPT0gY3VycmVudENhbGxiYWNrLmNvbnRleHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaTIsIDEpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoISBjYWxsYmFja3MubGVuZ3RoKSB7XG4gICAgdHJlZS5jYWxsYmFja3MgPSB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRW1pdCBldmVudFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuc1xuICogQHBhcmFtIHsqfSAuLi4gKG9wdGlvbmFsKVxuICogQHJldHVybiB7RXZlbnRFbWl0dGVyfVxuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiAobnMpIHtcbiAgbnMgPSBucy5zcGxpdCh0aGlzLl9ldmVudEVtaXR0ZXIuZGVsaW1pdGVyKTtcblxuICB0aGlzLl9zZWFyY2hUcmVlKHRoaXMuX2V2ZW50RW1pdHRlci50cmVlLCBucywgMCwgYXJndW1lbnRzKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGV2ZW50IGxpc3RlbmVyIGZvciBvbmNlXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKG9wdGlvbmFsKVxuICogQHJldHVybiB7RXZlbnRFbWl0dGVyfVxuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiAobnMsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gIHRoaXMub24obnMsIGNhbGxiYWNrLCBjb250ZXh0LCB0cnVlKTtcblxuICByZXR1cm4gdGhpcztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL3RlbXBsYXRlJyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRGVwZW5kZW5jaWVzXG4gKi9cbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJ3N0bHVhZmVkJyk7XG5cbi8qKlxuICogRXhwb3J0IGB0ZW1wbGF0ZWBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xudmFyIHRlbXBsYXRlID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RyKSB7XG4gIHZhciB0cGwgPSB0ZW1wbGF0ZS5jYWNoZVtzdHJdO1xuXG4gIGlmICh0cGwpIHtcbiAgICByZXR1cm4gdHBsO1xuICB9XG5cbiAgLypqc2hpbnQgZXZpbDogdHJ1ZSovXG4gIHRwbCA9IChuZXcgRnVuY3Rpb24oXG4gICAgJ2xvY2FscycsXG4gICAgJ2xvY2FscyA9IHRoaXMuZGVmYXVsdHMobG9jYWxzIHx8IHt9LCB0aGlzLmdsb2JhbHMpOycgK1xuICAgICd2YXIgX19wID0gW107JyArXG4gICAgJ19fcC5wdXNoKFxcJycgK1xuICAgIHN0ci5yZXBsYWNlKC9bXFxyXFx0XFxuXS9nLCAnICcpXG4gICAgICAucmVwbGFjZSgvJyg/PVteJV0qJT4pL2csICdcXHQnKVxuICAgICAgLnNwbGl0KCdcXCcnKS5qb2luKCdcXFxcXFwnJylcbiAgICAgIC5zcGxpdCgnXFx0Jykuam9pbignXFwnJylcbiAgICAgIC5yZXBsYWNlKC88JT0oLis/KSU+L2csICdcXCcsJDEsXFwnJylcbiAgICAgIC5yZXBsYWNlKC88JS0oLis/KSU+L2csICdcXCcsdGhpcy5lc2NhcGUoJDEpLFxcJycpXG4gICAgICAuc3BsaXQoJzwlJykuam9pbignXFwnKTsnKVxuICAgICAgLnNwbGl0KCclPicpLmpvaW4oJ19fcC5wdXNoKFxcJycpICtcbiAgICAnXFwnKTtyZXR1cm4gX19wLmpvaW4oXFwnXFwnKTsnXG4gICkpLmJpbmQoe1xuICAgICdkZWZhdWx0cyc6IGRlZmF1bHRzLFxuICAgICdnbG9iYWxzJzogdGVtcGxhdGUuZ2xvYmFscyxcbiAgICAnZXNjYXBlJzogdGVtcGxhdGUuZXNjYXBlXG4gIH0pO1xuICAvKmpzaGludCBldmlsOiBmYWxzZSovXG5cbiAgdGVtcGxhdGUuY2FjaGVbc3RyXSA9IHRwbDtcblxuICByZXR1cm4gdHBsO1xufTtcblxuLyoqXG4gKiBHbG9iYWxzIGFyZSBtZXJnZWQgaW50byBgbG9jYWxzYFxuICovXG50ZW1wbGF0ZS5nbG9iYWxzID0ge307XG5cbi8qKlxuICogQ2FjaGVcbiAqL1xudGVtcGxhdGUuY2FjaGUgPSB7fTtcblxuLyoqXG4gKiBFc2NhcGUgZnVuY3Rpb24gZm9yIDwlLSB2YXJpYWJsZSAlPiwgY2FuIGJlIG92ZXJyaWRkZW4gKGRlZmF1bHQgZXNjYXBlIEhUTUwpXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cbnRlbXBsYXRlLmVzY2FwZSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgcmV0dXJuIChzdHIgKyAnJylcbiAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0JylcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgLnJlcGxhY2UoLycvZywgJyYjMzknKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTWVyZ2UgZGVmYXVsdCB2YWx1ZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRlc3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZWZhdWx0c1xuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xudmFyIGRlZmF1bHRzID0gZnVuY3Rpb24gKGRlc3QsIHNyYywgcmVjdXJzaXZlKSB7XG4gIGZvciAodmFyIHByb3AgaW4gc3JjKSB7XG4gICAgaWYgKHJlY3Vyc2l2ZSAmJiBkZXN0W3Byb3BdIGluc3RhbmNlb2YgT2JqZWN0ICYmIHNyY1twcm9wXSBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgZGVzdFtwcm9wXSA9IGRlZmF1bHRzKGRlc3RbcHJvcF0sIHNyY1twcm9wXSwgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmICghIChwcm9wIGluIGRlc3QpKSB7XG4gICAgICBkZXN0W3Byb3BdID0gc3JjW3Byb3BdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkZXN0O1xufTtcblxuLyoqXG4gKiBFeHBvc2UgYGRlZmF1bHRzYC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0cztcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIFNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XSwgdW5peCB2ZXJzaW9uXG4vLyAncm9vdCcgaXMganVzdCBhIHNsYXNoLCBvciBub3RoaW5nLlxudmFyIHNwbGl0UGF0aFJlID1cbiAgICAvXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztcbnZhciBzcGxpdFBhdGggPSBmdW5jdGlvbihmaWxlbmFtZSkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSk7XG59O1xuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgdmFyIHBhdGggPSAoaSA+PSAwKSA/IGFyZ3VtZW50c1tpXSA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5yZXNvbHZlIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBpc0Fic29sdXRlID0gZXhwb3J0cy5pc0Fic29sdXRlKHBhdGgpLFxuICAgICAgdHJhaWxpbmdTbGFzaCA9IHN1YnN0cihwYXRoLCAtMSkgPT09ICcvJztcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBwICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGguam9pbiBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbi8vIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG5leHBvcnRzLnNlcCA9ICcvJztcbmV4cG9ydHMuZGVsaW1pdGVyID0gJzonO1xuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciByZXN1bHQgPSBzcGxpdFBhdGgocGF0aCksXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxuICAgICAgZGlyID0gcmVzdWx0WzFdO1xuXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZSB3aGF0c29ldmVyXG4gICAgcmV0dXJuICcuJztcbiAgfVxuXG4gIGlmIChkaXIpIHtcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIGRpciA9IGRpci5zdWJzdHIoMCwgZGlyLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgcmV0dXJuIHJvb3QgKyBkaXI7XG59O1xuXG5cbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBzcGxpdFBhdGgocGF0aClbMl07XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoKHBhdGgpWzNdO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBNZXJnZSBkZWZhdWx0IHZhbHVlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzdCBkZXN0aW5hdGlvbiBvYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBzcmMgc291cmNlIG9iamVjdFxuICogQHBhcmFtIHtCb29sZWFufSByZWN1cnNpdmUgbWVyZ2UgaW50byBkZXN0aW5hdGlvbiByZWN1cnNpdmVseSAoZGVmYXVsdDogZmFsc2UpXG4gKiBAcmV0dXJuIHtPYmplY3R9IGRlc3Qgb2JqZWN0XG4gKi9cbnZhciBkZWZhdWx0cyA9IGZ1bmN0aW9uIChkZXN0LCBzcmMsIHJlY3Vyc2l2ZSkge1xuICBmb3IgKHZhciBwcm9wIGluIHNyYykge1xuICAgIGlmICghIHNyYy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHJlY3Vyc2l2ZSAmJiBkZXN0W3Byb3BdIGluc3RhbmNlb2YgT2JqZWN0ICYmIHNyY1twcm9wXSBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgZGVzdFtwcm9wXSA9IGRlZmF1bHRzKGRlc3RbcHJvcF0sIHNyY1twcm9wXSwgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmICghIChwcm9wIGluIGRlc3QpKSB7XG4gICAgICBkZXN0W3Byb3BdID0gc3JjW3Byb3BdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkZXN0O1xufTtcblxuLyoqXG4gKiBFeHBvc2UgYGRlZmF1bHRzYC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0cztcbiJdfQ==