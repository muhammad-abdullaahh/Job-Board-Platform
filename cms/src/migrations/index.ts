import * as migration_20261019_175324_initial_staff_schema from './20261019_175324_initial_staff_schema';

export const migrations = [
  {
    up: migration_20261019_175324_initial_staff_schema.up,
    down: migration_20261019_175324_initial_staff_schema.down,
    name: '20261019_175324_initial_staff_schema'
  },
];
