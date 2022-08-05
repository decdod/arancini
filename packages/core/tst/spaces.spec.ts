/* eslint-disable max-classes-per-file */
import { describe, it, expect } from '@jest/globals';
import { WORLD_DEFAULT_SPACE_ID } from '../src/world';
import { World } from '../src';

describe('Spaces', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  it('should be able to register event handlers and emit events', () => {
    const space = world.create.space();

    world.init();

    const mockFn = jest.fn();

    const subscription = space.on('event-name', () => mockFn());

    expect(mockFn).toBeCalledTimes(0);

    space.emit({
      topic: 'event-name',
    });

    expect(mockFn).toBeCalledTimes(1);

    subscription.unsubscribe();

    space.emit({
      topic: 'event-name',
    });

    expect(mockFn).toBeCalledTimes(1);
  });

  it('should should remove dead entities on update', () => {
    const space = world.create.space();

    const entityOne = space.create.entity();
    const entityTwo = space.create.entity();

    world.init();

    world.update(1);

    expect(space.entities.size).toBe(2);

    entityOne.destroy();

    expect(space.entities.size).toBe(2);

    world.update(1);

    expect(space.entities.size).toBe(1);

    entityTwo.destroy({ immediately: true });

    // should be destroyed without an update
    expect(space.entities.size).toBe(0);
  });

  it('should destroy contained entities when destroying the space', () => {
    const space = world.create.space();

    expect(space.world).toBe(world);

    const entity = space.create.entity();

    // one space is the world's default space, the other is the newly created space
    expect(world.spaceManager.spaces.size).toBe(2);
    expect(entity.space).toBe(space);

    space.destroy();

    expect(entity.alive).toBeFalsy();

    // only the world's default space
    expect(world.spaceManager.spaces.size).toBe(1);
  });

  it('should throw an error on attempting to create a space that already exists', () => {
    expect(() => world.create.space({ id: WORLD_DEFAULT_SPACE_ID })).toThrow();
  });
});
