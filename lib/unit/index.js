let fs = require('fs');
let path = require('path');
let template = require('ak-template');
let defaults = require('stluafed');

let View = require('../view');
let Processor = require('./processor');

let modules = require('./modules');

// http://spritespace.blogspot.fr/2013/10/to-start-of-with-here-are-collection-of.html
// http://game-icons.net/
// http://opengameart.org/sites/default/files/dungeon_pre.png + http://opengameart.org/sites/default/files/dungeon_tiles_2.png
// http://opengameart.org/content/a-blocky-dungeon

module.exports = class Unit extends View {
  constructor (options = {}) {
    super(options);

    this.template = template(fs.readFileSync(path.join(__dirname, '../templates/unit.tpl'), 'utf-8'));
    this.options = defaults(options, {
      'events': [
      ],
      'type': 'robot',
      'name': 'anonymous',
      'direction': 'west',
      'fuel': 10,
      'modules': [
        'wheels'
      ]
    });

    this.map = options.map;
    this.programContext = {};
    this.processor = new Processor({
      'parent': this
    });

    for (let moduleName of this.options.modules) {
      this.addModule(moduleName);
    }
  }

  run (program) {
    this.processor.run(program);
  }

  render () {
    this.emit('rendering');
    this.renderTemplate(this.options);
    this.emit('render');

    return this;
  }

  addModule (module) {
    if (! modules[module]) {
      throw new Error(`Could not find module "${module}"`);
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
