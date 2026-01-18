// @vitest-environment node
import { test } from './context';

test('schema fixture is available in test context', ({ schema }) => {
  expect(schema).toBeDefined();
  expect(schema.db).toBeDefined();

  const team = schema.teams.create({ name: 'Test Team' });
  expect(team.name).toBe('Test Team');
  expect(team.id).toBeDefined();
});
