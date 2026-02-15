import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        extends: './vitest.lib.config.mts',
        test: { name: 'lib', root: './' },
      },
      {
        extends: './examples/task-board/vitest.config.mts',
        test: { name: 'example', root: './examples/task-board' },
      },
    ],
  },
});
