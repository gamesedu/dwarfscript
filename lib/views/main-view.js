let fs = require('fs');
let path = require('path');
let template = require('ak-template');
let defaults = require('stluafed');

let View = require('../view');

module.exports = class MainView extends View {
  constructor (options = {}) {
    super(options);

    this.template = template(fs.readFileSync(path.join(__dirname, '../templates/main-view.tpl'), 'utf-8'));
    this.mapTileTemplate = template(fs.readFileSync(path.join(__dirname, '../templates/map-tile.tpl'), 'utf-8'));
    this.lineNumberTemplate = template(fs.readFileSync(path.join(__dirname, '../templates/line-number.tpl'), 'utf-8'));
    this.options = defaults(options, {
      'events': [
        ['click', '.ds-run', 'onRunClick'],
        ['keypress', '#ds-editor-input', 'onEnter']
      ]
    });
  }

  render () {
    this.emit('rendering');
    this.renderTemplate.apply(this, arguments);

    this.map = this.el.querySelector('#ds-map');
    this.map.innerHTML = this.renderMap();

    this.editor = {
      'numbers': this.el.querySelector('#ds-editor-line-numbers'),
      'input': this.el.querySelector('#ds-editor-input')
    };

    this.editor.numbers.innerHTML = this.lineNumberTemplate({'number': 1});

    this.emit('render');

    return this;
  }

  renderMap () {
    let size = this.options.mapSize || 10;
    let mapHtml = '';

    for (let i = 0; i < size; i += 1) {
      for (let j = 0; j < size; j += 1) {
        let tileOptions = {
          'x': i,
          'y': j
        };

        mapHtml += this.mapTileTemplate(tileOptions);
      }
    }

    return mapHtml;
  }

  selectTile (coordinates) {
    let x = coordinates.x;
    let y = coordinates.y;
    let selector = `.ds-map-tile[data-position-x="${x}"][data-position-y="${y}"]`;

    return this.map.querySelector(selector);
  }
  onRunClick () {
    let rawCode = this.editor.input.value;

    this.emit('program.run', rawCode);
  }

  onEnter (e) {
    if (e.keyCode === 13) {
      let lineCount = this.editor.input.value.split('\n').length;
      let lineNumbersHtml = '';

      for (let i = 1; i <= lineCount + 1; i += 1) {
        lineNumbersHtml += this.lineNumberTemplate({'number': i});
      }

      this.editor.numbers.innerHTML = lineNumbersHtml;
    }
  }
  drawUnit (unit) {
    let tile = this.selectTile(unit.position);

    if (unit.el) {
      unit.el.parentElement.removeChild(unit.el);
    }
    if (! unit.el) {
      unit.render();
    }

    tile.appendChild(unit.el);
  }

  moveUnit (unit, coordinates) {
    let tile = this.selectTile(coordinates);

    if (tile) {
      unit.position = coordinates;
      this.drawUnit(unit);
      return;
    }
    /* eslint-disable no-console */
    console.log('move disallowed');
  }
};
