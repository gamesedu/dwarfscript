/**
 * helper
 */
let matchAncestorOf = (child, parentSelector, stopAtElement) => {
  if (! parentSelector) {
    return stopAtElement;
  }

  if (! child || child === stopAtElement) {
    return false;
  }

  if (child.matches(parentSelector)) {
    return child;
  }

  return matchAncestorOf(child.parentElement, parentSelector, stopAtElement);
};

/**
 * @class DomDelegate
 */
module.exports = class DomDelegate {
  /**
   * constructor
   *
   * @param {Element} root - root element which will be actually bound
   */
  constructor (root) {
    if (! root) {
      throw new Error('Missing `root` argument');
    }

    this.root = root;
    this.events = {};
  }

  //The callback has the follow signature:
  //
  //```
  //function callback(domNativeEvent, extraData)
  //
  //extraData = {
  //  'matchedTarget': HTMLElement // this is the element which matches given selector
  //}
  //```
  /**
   * add listener
   *
   * @param {String} event
   * @param {String} selector
   * @param {Function} callback
   * @param {*} [context]
   * @return {DomDelegate}
   */
  on (event, selector, callback, context) {
    if (typeof selector === 'function') {
      context = callback;
      callback = selector;
      selector = '';
    }

    if (! callback) {
      throw new Error('Missing `callback` argument');
    }

    selector = selector || '';
    context = context || null;

    let callbacks = this.events[event];

    //We add only one listener per event and then look for matching delegation later
    if (! callbacks) {
      callbacks = this.events[event] = [];

      let delegate = this.events[event].delegationCallback = (e) => {
        this.events[event]
          .filter((scope) => {
            return ! scope.selector && e.target === this.root || matchAncestorOf(e.target, scope.selector, this.root);
          }).forEach((scope) => {
            let matchedTarget = scope.selector === '' && this.root || matchAncestorOf(e.target, scope.selector, this.root);

            if (scope.context) {
              return scope.callback.call(scope.context, e, {'matchedTarget': matchedTarget});
            }

            scope.callback(e, {'matchedTarget': matchedTarget});
          });
      };

      this.root.addEventListener(event, delegate, true);
    }

    callbacks.push({
      'selector': selector,
      'callback': callback,
      'context': context
    });

    return this;
  }

  /**
   * remove event listener
   *
   * @param {String} [event]
   * @param {String} [selector]
   * @param {Function} [callback]
   * @param {*} [context]
   * @return {DomDelegate}
   */
  /*eslint complexity: [2, 20]*/
  off (event, selector, callback, context) {
    let arity = arguments.length;

    if (typeof selector === 'function') {
      context = callback;
      callback = selector;
      selector = '';
    }

    selector = selector || '';
    context = context || null;

    if (arity === 0) {
      for (event in this.events) {
        this.root.removeEventListener(event, this.events[event].delegationCallback, true);
      }

      this.events = {};

      return this;
    }

    if (! this.events[event]) {
      return this;
    }

    if (arity === 1) {
      this.root.removeEventListener(event, this.events[event].delegationCallback, true);

      delete this.events[event];

      return this;
    }

    let delegationCallback = this.events[event].delegationCallback;

    this.events[event] = this.events[event].filter((scope) => {
      return ! (arity === 2 && scope.selector === selector
        || arity === 3 && scope.selector === selector && scope.callback === callback
        || arity === 4 && scope.selector === selector && scope.callback === callback && scope.context === context);
    });
    this.events[event].delegationCallback = delegationCallback;

    if (! this.events[event].length) {
      this.root.removeEventListener(event, this.events[event].delegationCallback, true);

      delete this.events[event];
    }

    return this;
  }

  /**
   * destructor
   */
  destroy () {
    this.off();

    this.root = null;
    this.events = null;
  }
};
