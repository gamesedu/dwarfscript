let fs = require('fs');
let path = require('path');
let template = require('ak-template');
let defaults = require('stluafed');

let View = require('../view');

let maps = require('../maps');

module.exports = class Map extends View {
  constructor (options = {}) {
    super(options);

    this.template = template(fs.readFileSync(path.join(__dirname, '../templates/map.tpl'), 'utf-8'));
    this.mapTileTemplate = template(fs.readFileSync(path.join(__dirname, '../templates/map-tile.tpl'), 'utf-8'));

    this.options = defaults(options, {
      'events': [],
      'map': maps[0]
    });

    this.map = this.initMap(options.map);
  }

  render () {
    this.emit('rendering');
    this.renderTemplate.apply(this, arguments);

    let mapHtml = '';

    for (let y = 0; y < this.map.length; y += 1) {
      for (let x = 0; x < this.map[y].length; x += 1) {
        mapHtml += this.mapTileTemplate(this.map[y][x]);
      }
    }

    this.el.innerHTML = mapHtml;
    this.saveTileElements();

    this.emit('render');

    return this;
  }

  initMap (plan) {
    let map = [];

    plan = plan.split('\n');

    for (let y = 0, ylen = plan.length; y < ylen; y += 1) {
      let row = plan[y].split('');

      map.push([]);

      for (let x = 0, xlen = row.length; x < xlen; x += 1) {
        let tile = {
          'x': x,
          'y': y,
          'type': 'floor'
        };

        if (plan[y][x] !== '_') {
          tile.type = 'wall';
          tile.imgClass = plan[y][x];
        }

        map[y].push(tile);
      }
    }

    return map;
  }
  saveTileElements () {
    for (let y = 0; y < this.map.length; y += 1) {
      for (let x = 0; x < this.map[y].length; x += 1) {
        let selector = `.ds-map-tile[data-position-x="${x}"][data-position-y="${y}"]`;

        this.map[y][x].el = this.el.querySelector(selector);
      }
    }
  }
  selectTile (coordinates) {
    if (! coordinates) {
      throw new Error('No coordinates provided for selectTile');
    }
    let result = null;

    result = this.map[coordinates.y] && this.map[coordinates.y][coordinates.x];

    return result;
  }
  drawUnit (unit) {
    let tile = this.selectTile(unit.position);

    if (unit.el) {
      unit.el.parentElement.removeChild(unit.el);
    }
    if (! unit.el) {
      unit.render();
    }

    tile.el.appendChild(unit.el);
  }

  moveUnit (unit, coordinates) {
    let tile = this.selectTile(coordinates);

    if (tile && tile.type !== 'wall') {
      unit.position = coordinates;
      this.drawUnit(unit);
      return;
    }
    unit.processor.log('move disallowed');
  }
};
