export const PENDING_TASK_TYPES = [
  "Documentación",
  "Mantenimiento",
  "Inspección",
  "Pruebas",
  "Operaciones",
  "Otro",
];

export const PENDING_TASK_TYPE_FILTER_ALL = "Todos";

export const PENDING_TASK_TYPE_FILTER_OPTIONS = [
  PENDING_TASK_TYPE_FILTER_ALL,
  ...PENDING_TASK_TYPES,
];

export function getPendingTaskType(task) {
  if (task?.taskType && PENDING_TASK_TYPES.includes(task.taskType)) {
    return task.taskType;
  }

  return "Otro";
}

export function filterByPendingTaskType(items, selectedType) {
  if (!selectedType || selectedType === PENDING_TASK_TYPE_FILTER_ALL) {
    return items;
  }

  return items.filter((item) => getPendingTaskType(item) === selectedType);
}
