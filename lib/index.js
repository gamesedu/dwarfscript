let MainView = require('./views/main-view');
let Unit = require('./unit');
let parse = require('./parser');

let maps = require('./maps');

module.exports = class Application {
  constructor () {
    this.view = new MainView({
      'map': maps[0]
    });
    this.dwarf = new Unit({
      'type': 'dwarf',
      'name': 'Gimlet',
      'modules': [
        'legs',
        'sensor'
      ],
      'map': this.view.map
    });

    this.view.on('program.run', this.onProgramRun.bind(this));
    this.dwarf.on('unit.move', this.onUnitMove.bind(this));
  }

  run () {
    this.dwarf.position = {'x': 1, 'y': 2};
    this.view.map.drawUnit(this.dwarf);
  }

  onProgramRun (e, code) {
    if (this.dwarf.processor.running) {
      this.dwarf.processor.running = false;
      this.view.runButton.innerHTML = 'RUN';
      this.view.runButton.classList.remove('ds-execution-stop');
      return;
    }

    let program = parse(code);

    if (program.status === 'ok') {
      this.dwarf.run(program.tree);
      this.view.runButton.innerHTML = 'STOP';
      this.view.runButton.classList.add('ds-execution-stop');
    }
    this.view.renderParsingLog(program.log);
  }

  onUnitMove (e, unit, coordinates) {
    this.view.map.moveUnit(unit, coordinates);
  }
};
