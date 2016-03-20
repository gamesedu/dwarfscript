let directions = require('../../directions');

module.exports = function sensor (parent) {
  //let scanRange = 1;
  let info = {
    'general': {
      'status': 'ok'
    },
    'scan': {
      'duration': 20
    }
  };

  return {
    'info': (infoName) => {
      return info[infoName];
    },
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
