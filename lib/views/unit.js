let fs = require('fs');
let path = require('path');
let template = require('ak-template');
let defaults = require('stluafed');

let View = require('../view');

let directions = ['top', 'right', 'bottom', 'left'];

//http://spritespace.blogspot.fr/2013/10/to-start-of-with-here-are-collection-of.html

module.exports = class Unit extends View {
  constructor (options = {}) {
    super(options);

    this.template = template(fs.readFileSync(path.join(__dirname, '../templates/unit.tpl'), 'utf-8'));
    this.options = defaults(options, {
      'events': [
      ],
      'type': 'dwarf',
      'name': 'anonymous',
      'direction': 'left'
    });

    this.programContext = {
      'fuel': 10
    };
  }

  render () {
    this.emit('rendering');
    this.renderTemplate(this.options);
    this.emit('render');

    return this;
  }

  run (program) {
    let i = 0;
    let cb = () => console.log('done !');

    this.nextLine(program, i, cb/*, run.bind(this, program)*/);
  }

  nextLine (program, i, callback) {
    setTimeout(function exec () {
      let line = program[i];
      let lineType = line.type;
      let last = i + 1 <= program.length;

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
        this[program[i].method] && this[program[i].method]();
        next();
      }
    }.bind(this), 300);
  }

  rotate (direction = 'clockwise') {
    let dir = directions.indexOf(this.direction);

    for (let i = 0, len = directions.length; i < len; i += 1) {
      this.el.classList.remove(`ds-direction-${directions[i]}`);
    }

    if (direction === 'clockwise') {
      dir = (dir + 1) % directions.length;
    } else {
      dir = (dir - 1) % directions.length;
    }

    this.direction = directions[dir];
    this.el.classList.add(`ds-direction-${this.direction}`);

    return this;
  }

  forward () {
    let x = this.position.x;
    let y = this.position.y;
    let movement = {
      'top': () => x -= 1,
      'right': () => y += 1,
      'bottom': () => x += 1,
      'left': () => y -= 1
    };

    movement[this.direction]();

    this.emit('unit.move', this, {'x': x, 'y': y});
  }

  set direction (direction) {
    this.options.direction = direction;
  }
  get direction () {
    return this.options.direction;
  }
  set name (name) {
    this.options.name = name;
  }
  get name () {
    return this.options.name;
  }
  set type (type) {
    this.options.type = type;
  }
  get type () {
    return this.options.type;
  }
};
