/**
 * User roles in the application
 */
export enum UserRole {
  USER = 'USER',
  MANAGER = 'MANAGER',
}

/**
 * Task status lifecycle
 */
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

/**
 * Task priority levels
 */
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}
