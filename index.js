let Application = require('./lib/index');
let application = new Application();

application.view.on('render', function run () {
  application.run();
});
document.body.appendChild(application.view.render().el);
