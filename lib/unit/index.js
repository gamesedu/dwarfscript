let fs = require('fs');
let path = require('path');
let template = require('ak-template');
let defaults = require('stluafed');

let View = require('../view');

let modules = require('./modules');

//http://spritespace.blogspot.fr/2013/10/to-start-of-with-here-are-collection-of.html

module.exports = class Unit extends View {
  constructor (options = {}) {
    super(options);

    this.template = template(fs.readFileSync(path.join(__dirname, '../templates/unit.tpl'), 'utf-8'));
    this.options = defaults(options, {
      'events': [
      ],
      'type': 'robot',
      'name': 'anonymous',
      'direction': 'right',
      'fuel': 10,
      'modules': [
        'wheels'
      ]
    });
    this.programContext = {};

    for (let moduleName of this.options.modules) {
      this.addModule(moduleName);
    }
  }

  render () {
    this.emit('rendering');
    this.renderTemplate(this.options);
    this.emit('render');

    return this;
  }

  run (program) {
    let i = 0;

    if (! this.running) {
      this.running = true;

      this.nextLine(program, i, () => {
        this.running = false;
        this.run(program);
      });
    }
  }

  nextLine (program, i, callback) {
    setTimeout(function exec () {
      if (! this.running) {
        return;
      }

      let line = program[i];
      let lineType = line.type;
      let last = i + 1 === program.length;

      let next = this.nextLine.bind(this, program, i + 1, callback);

      if (last) {
        next = callback;
      }

      if (lineType === 'assign') {
        this[program[i]] && this[program[i]]();
        next();
      }
      if (lineType === 'if') {
        if (line.condition) {
          this.nextLine(line.subTree, 0, next);
        } else {
          next();
        }
      }
      if (lineType === 'call') {
        let methodInfo = program[i].method;
        let methodContext = 'programContext';
        let methodName = '';
        let parameters = program[i].arguments;

        if (methodInfo.length === 1) {
          methodName = methodInfo[0];
        }
        if (methodInfo.length === 2) {
          methodContext = methodInfo[0];
          methodName = methodInfo[1];
        }

        if (! this[methodContext] || ! this[methodContext][methodName]) {
          throw new Error(`${this.name} the ${this.type} cannot run "${methodInfo}(${parameters})"`);
        }

        this[methodContext][methodName].apply(this, parameters);
        next();
      }
    }.bind(this), 300);
  }

  addModule (module) {
    if (! modules[module]) {
      throw new Error(`Could not find module ${module}`);
    }

    this[module] = modules[module](this);
  }

  useFuel (amt = 1) {
    if (this.type === 'robot') {
      this.fuel -= amt;
    }
  }
  get fuel () {
    return this.options.fuel;
  }

  set direction (direction) {
    this.options.direction = direction;
  }
  get direction () {
    return this.options.direction;
  }
  set name (name) {
    throw new Error(`Attempting to assign ${name} to name which is a read only property`);
  }
  get name () {
    return this.options.name;
  }
  set type (type) {
    throw new Error(`Attempting to assign ${type} to type which is a read only property`);
  }
  get type () {
    return this.options.type;
  }
};
