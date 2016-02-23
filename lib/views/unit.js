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
  }

  render () {
    this.emit('rendering');
    this.renderTemplate(this.options);
    this.emit('render');

    return this;
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

  run (program) {
    let i = 0;

    this.nextLine(program, i);
  }

  nextLine (program, i) {
    setTimeout(function exec () {
      this[program[i]] && this[program[i]]();

      if (i + 1 < program.length) {
        this.nextLine(program, i + 1);
      }
    }.bind(this), 300);
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
