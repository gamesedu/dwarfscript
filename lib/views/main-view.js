let fs = require('fs');
let path = require('path');
let template = require('ak-template');
let defaults = require('stluafed');

let View = require('../view');
let Map = require('./map');

module.exports = class MainView extends View {
  constructor (options = {}) {
    super(options);

    this.template = template(fs.readFileSync(path.join(__dirname, '../templates/main-view.tpl'), 'utf-8'));
    this.lineNumberTemplate = template(fs.readFileSync(path.join(__dirname, '../templates/line-number.tpl'), 'utf-8'));
    this.options = defaults(options, {
      'events': [
        ['click', '.ds-run', 'onRunClick'],
        ['keypress', '#ds-editor-input', 'onEnter']
      ]
    });

    this.map = new Map({
      'map': this.options.map
    });
  }

  render () {
    this.emit('rendering');
    this.renderTemplate.apply(this, arguments);

    let mapPanel = this.el.querySelector('#ds-map-panel');

    mapPanel.appendChild(this.map.render().el);

    this.runButton = this.el.querySelector('.ds-run');
    this.editor = {
      'numbers': this.el.querySelector('#ds-editor-line-numbers'),
      'input': this.el.querySelector('#ds-editor-input')
    };

    this.editor.input.value = `if(sensor.scan() != 'clear') {
 legs.turn('left')
}
legs.forward()`;
    this.onEnter();

    this.emit('render');

    return this;
  }

  renderParsingLog (log) {
    let lineNumbers = this.el.querySelectorAll('.ds-editor-line-number');

    for (let i = 0, len = lineNumbers.length; i < len; i += 1) {
      lineNumbers[i].classList.remove('ds-parsing-error');
    }

    for (let i = 0, len = log.length; i < len; i += 1) {
      let displayedNumber = log[i].line + 1;
      let lineNumber = this.el.querySelector(`.ds-editor-line-number[data-line-number="${displayedNumber}"]`);

      if (! lineNumber) {
        return;
      }

      lineNumber.classList.add('ds-parsing-error');
      lineNumber.title = log[i].message;
    }
  }

  onRunClick () {
    let rawCode = this.editor.input.value;

    this.emit('program.run', rawCode);
  }

  onEnter () {
    let lineCount = this.editor.input.value.split('\n').length;
    let lineNumbersHtml = '';

    for (let i = 1; i <= lineCount + 1; i += 1) {
      lineNumbersHtml += this.lineNumberTemplate({'number': i});
    }

    this.editor.input.rows = lineCount + 3;
    this.editor.numbers.innerHTML = lineNumbersHtml;
  }
};
