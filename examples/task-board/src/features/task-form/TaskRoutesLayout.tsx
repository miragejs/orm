import { Outlet } from 'react-router';

/**
 * Layout that renders the outlet for nested task routes (form index and delete).
 */
export default function TaskRoutesLayout() {
  return <Outlet />;
}
