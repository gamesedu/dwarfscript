let MainView = require('./views/main-view');
let Unit = require('./unit');
let parse = require('./parser');

module.exports = class Application {
  constructor () {
    this.view = new MainView({
      'mapSize': 10
    });
    this.dwarf = new Unit({
      'type': 'dwarf',
      'name': 'Gimlet',
      'modules': [
        'legs'
      ]
    });

    this.view.on('program.run', this.onProgramRun.bind(this));
    this.dwarf.on('unit.move', this.onUnitMove.bind(this));
  }

  run () {
    this.dwarf.position = {'x': 0, 'y': 0};
    this.view.drawUnit(this.dwarf);
  }

  onProgramRun (e, code) {
    if (this.dwarf.running) {
      this.dwarf.running = false;
      return;
    }

    let program = parse(code);

    if (program.status === 'ok') {
      this.dwarf.run(program.tree);
    }
    this.view.renderParsingLog(program.log);
  }

  onUnitMove (e, unit, coordinates) {
    this.view.moveUnit(unit, coordinates);
  }
};
