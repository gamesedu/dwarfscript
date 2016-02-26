let directions = ['top', 'right', 'bottom', 'left'];

module.exports = function wheels (parent) {
  return {
    'turn': function turn (direction = 'clock') {
      let dir = directions.indexOf(parent.direction);
      let clock = {
        'clock': 1,
        'counter': - 1
      };

      for (let i = 0, len = directions.length; i < len; i += 1) {
        parent.el.classList.remove(`ds-direction-${directions[i]}`);
      }

      dir = ((dir + clock[direction]) % directions.length + directions.length) % directions.length;

      parent.direction = directions[dir];
      parent.el.classList.add(`ds-direction-${parent.direction}`);

      return parent;
    },
    'forward': function forward () {
      let x = parent.position.x;
      let y = parent.position.y;
      let movement = {
        'top': () => {
          x -= 1;
        },
        'right': () => {
          y += 1;
        },
        'bottom': () => {
          x += 1;
        },
        'left': () => {
          y -= 1;
        }
      };

      if (parent.fuel <= 0) {
        console.log(`${parent.name} the ${parent.type} has no more fuel.`);
        return;
      }

      movement[parent.direction]();

      parent.useFuel();
      parent.emit('unit.move', parent, {'x': x, 'y': y});
    }
  };
};
