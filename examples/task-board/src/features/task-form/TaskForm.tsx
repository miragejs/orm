import {
  useLoaderData,
  useNavigate,
  useNavigation,
  useLocation,
  useRouteLoaderData,
  redirect,
} from 'react-router';
import { getTeam } from '@features/team/api';
import { getTaskDetails } from '@features/task-details/api';
import { UserRole } from '@shared/enums';
import type { TaskFormValues, User } from '@shared/types';
import { createTask } from './api/createTask';
import { updateTask } from './api/updateTask';
import TaskFormDialog from './components/TaskFormDialog';
import TaskFormFields from './components/TaskFormFields';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';

const TASK_ID_NEW = 'new';

/** JSON body submitted by the task form */
interface TaskFormActionPayload extends TaskFormValues {
  redirectTo: string;
  taskId: string;
}

/**
 * Loader – fetches team (for assignee options) and task when editing
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const taskId = params.taskId;
  if (!taskId) {
    throw new Response('Task ID is required', { status: 400 });
  }

  const isCreate = taskId === TASK_ID_NEW;
  const mode = isCreate ? 'create' : 'edit';

  const [team, task] = await Promise.all([
    getTeam(),
    isCreate ? Promise.resolve(null) : getTaskDetails(taskId),
  ]);

  return {
    mode,
    task,
    taskId,
    team,
  };
}

export type TaskFormLoaderData = Awaited<ReturnType<typeof loader>>;

/**
 * Action – create or update task, then redirect to task details.
 * Expects JSON body (Form with encType="application/json").
 */
export async function action({ request }: ActionFunctionArgs) {
  const body = (await request.json()) as TaskFormActionPayload;
  const { redirectTo = '/', taskId = '', ...values } = body;
  const { title, dueDate } = values;

  if (!title) {
    return { error: 'Title is required' };
  }
  if (!dueDate) {
    return { error: 'Due date is required' };
  }

  try {
    if (taskId === TASK_ID_NEW || !taskId) {
      const task = await createTask(values);
      return redirect(`${redirectTo}/${task.id}`);
    }

    await updateTask(taskId, values);
    return redirect(`${redirectTo}/${taskId}`);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to save task',
    };
  }
}

/**
 * TaskForm – route feature component (data container).
 * Loader/action manage data; form and state live in TaskFormFields.
 */
export default function TaskForm() {
  const currentUser = useRouteLoaderData<User>('root')!;
  const { mode, task, taskId, team } = useLoaderData<TaskFormLoaderData>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const location = useLocation();

  const isEdit = mode === 'edit';
  const isSubmitting =
    navigation.state === 'submitting' || navigation.state === 'loading';
  const defaultAssigneeId =
    currentUser.role === UserRole.USER ? currentUser.id : undefined;
  const redirectTo = location.pathname.replace(/\/tasks\/[^/]+$/, '');

  const handleClose = () => {
    navigate(redirectTo);
  };

  return (
    <TaskFormDialog
      onClose={handleClose}
      isEdit={isEdit}
      submitting={isSubmitting}
      submitLabel={isEdit ? 'Save' : 'Create'}
    >
      <TaskFormFields
        defaultAssigneeId={defaultAssigneeId}
        members={team.members}
        redirectTo={redirectTo}
        task={task}
        taskId={taskId}
      />
    </TaskFormDialog>
  );
}
