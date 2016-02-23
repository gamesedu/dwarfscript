let EventEmitter = require('ak-eventemitter');
let DomDelegate = require('./dom-delegate');

module.exports = class View extends EventEmitter {
  constructor (options = {}) {
    super(options);

    this.events = {};
    this.element = null;
    this.delegate = null;
    this.options = options;
  }

  /**
   * view's main DOM element
   *
   * @return {Element}
   */
  get el () {
    return this.element;
  }

  /**
   * bind events to the view's main DOM element
   *
   * @throws Error - if view has not been rendered
   *
   * @param {Array<ViewEvent>} [events]
   * @return {View}
   */
  bind (events = this.options.events) {
    if (! this.element) {
      throw new Error('View has not been rendered yet.');
    }

    if (! events) {
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
  unbind (events = this.options.events) {
    if (! this.element) {
      throw new Error('View has not been rendered yet.');
    }

    if (! events) {
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
  renderTemplate (data) {
    //Will always unbind before rendering if main element is already set.
    if (this.element) {
      this.unbind();
      this.delegate.destroy();
    }

    if (! this.template) {
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
  render () {
    this.emit('rendering');
    this.renderTemplate.apply(this, arguments);
    this.emit('render');

    return this;
  }

  domify (str) {
    let div = document.createElement('div');

    div.innerHTML = str;

    return div.firstElementChild;
  }

  handleEvents (action, events) {
    let event;
    let selector;
    let callback;
    let context;
    let scope;

    for (let i = 0, len = events.length; i < len; i += 1) {
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

      if (! selector) {
        this.delegate[action](event, '', callback, context);

        continue;
      }

      selector = Array.isArray(selector) ? selector : [selector];

      for (let j = 0; j < selector.length; j += 1) {
        this.delegate[action](event, selector[j], callback, context);
      }
    }
  }
};
