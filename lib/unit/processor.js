module.exports = class Processor {
  constructor (options = {}) {
    this.parent = options.parent;
    this.executionLog = [];
  }

  run (program) {
    let i = 0;

    if (! this.running) {
      this.running = true;

      this.log('Program starting from the top');

      this.nextLine(program, i, () => {
        this.running = false;
        this.run(program);
      });
    }
  }

  nextLine (program, i, callback) {
    if (! this.running) {
      return;
    }

    let line = program[i];
    let lineType = line.type;
    let last = i + 1 === program.length;

    let nextContent = this.nextLine.bind(this, program, i + 1, callback);

    if (last) {
      nextContent = callback;
    }

    let next = function next (delay = 0) {
      setTimeout(function exec () {
        nextContent();
      }, delay);
    };

    if (lineType === 'assign') {
      //this[program[i]] && this[program[i]]();
      next();
    }
    if (lineType === 'if') {
      if (this.testCondition(line.condition)) {
        this.nextLine(line.subTree, 0, next);
      } else if (line.elseTree) {
        this.nextLine(line.elseTree, 0, next);
      } else {
        next();
      }
    }
    if (lineType === 'call') {
      let methodInfo = this.execCall(program[i]);

      next(methodInfo.info.duration);
    }
  }

  execCall (call) {
    let methodPath = call.method;
    let methodInfo = {};
    let methodContext = 'programContext';
    let methodName = '';
    let parameters = [];

    if (methodPath.length === 1) {
      methodName = methodPath[0];
    }
    if (methodPath.length === 2) {
      methodContext = methodPath[0];
      methodName = methodPath[1];
    }

    if (! this.parent[methodContext] || ! this.parent[methodContext][methodName]) {
      throw new Error(`${this.parent.name} the ${this.parent.type} cannot run "${methodPath.join('.')}(${parameters})"`);
    }

    for (let i = 0, len = call.arguments.length; i < len; i += 1) {
      parameters.push(this.getArgumentValue(call.arguments[i]));
    }

    //get info from module
    methodInfo = this.parent[methodContext].info && this.parent[methodContext].info(methodName);

    return {
      'return': this.parent[methodContext][methodName].apply(this.parent, parameters),
      'info': methodInfo
    };
  }

  testCondition (condition) {
    if (condition.operator === 'equals') {
      return this.getArgumentValue(condition.a) === this.getArgumentValue(condition.b);
    }
    if (condition.operator === 'notequals') {
      return this.getArgumentValue(condition.a) !== this.getArgumentValue(condition.b);
    }
    return false;
  }

  getArgumentValue (arg) {
    if (arg.type === 'string') {
      return arg.value;
    }
    if (arg.type === 'call') {
      let value = this.execCall(arg);

      return value.return;
    }

    return false;
  }

  log (text) {
    /* eslint-disable no-console */
    console.log(text);
    this.executionLog.push(text);
  }
};
