let relative = {
  'ahead': 0,
  'right': 1,
  'behind': 2,
  'left': - 1
};
let absolute = ['north', 'west', 'south', 'east'];

module.exports = {
  'absolute': absolute,
  'relative': relative,
  'getAbsoluteFromTurn': (currentDirection, turn) => {
    let dir = absolute.indexOf(currentDirection);
    let clock = {
      'clock': 1,
      'right': 1,
      'counter': - 1,
      'left': - 1
    };

    dir = ((dir + clock[turn]) % absolute.length + absolute.length) % absolute.length;

    return absolute[dir];
  },
  'getAbsoluteFromRelative': (currentDirection, rel) => {
    let dir = absolute.indexOf(currentDirection);

    if (! relative.hasOwnProperty(rel)) {
      return rel;
    }

    dir = ((dir + relative[rel]) % absolute.length + absolute.length) % absolute.length;

    return absolute[dir];
  },
  'getNextTileCoordinates': (coordinates, direction) => {
    let x = coordinates.x;
    let y = coordinates.y;
    let movement = {
      'north': () => {
        y -= 1;
      },
      'west': () => {
        x += 1;
      },
      'south': () => {
        y += 1;
      },
      'east': () => {
        x -= 1;
      }
    };

    movement[direction]();

    return {'x': x, 'y': y};
  }
};
