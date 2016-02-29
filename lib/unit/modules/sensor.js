let directions = require('../../directions');

module.exports = function sensor (parent) {
  //let scanRange = 1;

  return {
    'scan': (direction = 'ahead') => {
      let absoluteDirection = directions.getAbsoluteFromRelative(parent.direction, direction);
      let lookAt = directions.getNextTileCoordinates(parent.position, absoluteDirection);
      let tile = parent.map.selectTile(lookAt);

      if (! tile || tile.type === 'wall') {
        return 'obstacle';
      }

      return 'clear';
    }
  };
};
