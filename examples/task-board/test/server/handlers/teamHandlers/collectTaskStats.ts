import { TaskStatus } from '@shared/enums';
import { TaskModel } from '@test/schema/models';
import type { ModelCollection } from 'miragejs-orm';
import type { TaskStatistics } from '@shared/types';
import type { TestCollections } from '@test/schema';

/**
 * Collects task statistics aggregated by date from a list of tasks.
 * Groups tasks by their creation date and counts:
 * - created: total tasks created on that date
 * - completed: tasks with DONE status
 * - inProgress: tasks with IN_PROGRESS status
 */
export function collectTaskStats(
  tasks: ModelCollection<TaskModel, TestCollections>,
): TaskStatistics {
  const sortedTasks = tasks.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const tasksByDate = new Map<
    string,
    { created: number; completed: number; inProgress: number }
  >();

  sortedTasks.forEach((task) => {
    const date = new Date(task.createdAt).toISOString().split('T')[0];

    if (!tasksByDate.has(date)) {
      tasksByDate.set(date, { created: 0, completed: 0, inProgress: 0 });
    }

    const stats = tasksByDate.get(date)!;
    stats.created += 1;

    if (task.status === TaskStatus.DONE) {
      stats.completed += 1;
    } else if (task.status === TaskStatus.IN_PROGRESS) {
      stats.inProgress += 1;
    }
  });

  const result: TaskStatistics = {
    dates: [],
    created: [],
    completed: [],
    inProgress: [],
  };

  tasksByDate.forEach((v, date) => {
    result.dates.push(date);
    result.created.push(v.created);
    result.completed.push(v.completed);
    result.inProgress.push(v.inProgress);
  });

  return result;
}
