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
    setTimeout(function exec () {
      if (! this.running) {
        return;
      }

      let line = program[i];
      let lineType = line.type;
      let last = i + 1 === program.length;

      let next = this.nextLine.bind(this, program, i + 1, callback);

      if (last) {
        next = callback;
      }

      if (lineType === 'assign') {
        //this[program[i]] && this[program[i]]();
        next();
      }
      if (lineType === 'if') {
        if (this.testCondition(line.condition)) {
          this.nextLine(line.subTree, 0, next);
        } else {
          next();
        }
      }
      if (lineType === 'call') {
        this.execCall(program[i]);

        next();
      }
    }.bind(this), 300);
  }

  execCall (call) {
    let methodInfo = call.method;
    let methodContext = 'programContext';
    let methodName = '';
    let parameters = [];

    if (methodInfo.length === 1) {
      methodName = methodInfo[0];
    }
    if (methodInfo.length === 2) {
      methodContext = methodInfo[0];
      methodName = methodInfo[1];
    }

    if (! this.parent[methodContext] || ! this.parent[methodContext][methodName]) {
      throw new Error(`${this.parent.name} the ${this.parent.type} cannot run "${methodInfo.join('.')}(${parameters})"`);
    }

    for (let i = 0, len = call.arguments.length; i < len; i += 1) {
      parameters.push(this.getArgumentValue(call.arguments[i]));
    }

    return this.parent[methodContext][methodName].apply(this.parent, parameters);
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
      return this.execCall(arg);
    }

    return false;
  }

  log (text) {
    this.executionLog.push(text);
  }
};
