let directions = require('../../directions');

module.exports = function wheels (parent) {
  return {
    'turn': function turn (direction = 'clock') {
      for (let i = 0, len = directions.absolute.length; i < len; i += 1) {
        parent.el.classList.remove(`ds-direction-${directions.absolute[i]}`);
      }

      parent.direction = directions.getAbsoluteFromTurn(parent.direction, direction);
      parent.el.classList.add(`ds-direction-${parent.direction}`);

      return parent;
    },
    'forward': function forward () {
      let newCoordinates = directions.getNextTileCoordinates(parent.position, parent.direction);

      if (parent.fuel <= 0) {
        parent.log(`${parent.name} the ${parent.type} has no more fuel.`);
        return;
      }

      parent.useFuel();
      parent.emit('unit.move', parent, newCoordinates);
    }
  };
};
