import { getPendingTaskType } from "./pendingTaskTypes";

export function buildAllPendientes(hangars = [], aircraftByHangar = {}) {
  const pendientes = [];

  for (const hangar of hangars) {
    const hangarId = hangar._id?.toString?.() || hangar._id || hangar.id;
    const aircraftList = aircraftByHangar[hangarId] || [];

    for (const aircraft of aircraftList) {
      if (aircraft.status === "Salida") {
        continue;
      }

      const pendingTasks =
        aircraft.maintenanceTasks?.filter(
          (task) => task.status === "pending"
        ) || [];

      for (const task of pendingTasks) {
        pendientes.push({
          taskId: task._id,
          aircraftId: aircraft._id,
          hangarId,
          hangarName: hangar.name || hangar.label,
          registration: aircraft.registration,
          manufacturer: aircraft.manufacturer,
          title: task.title,
          description: task.description,
          taskType: getPendingTaskType(task),
          entryDate: aircraft.entryDate,
          createdAt: task.createdAt,
        });
      }
    }
  }

  return pendientes.sort((a, b) => {
    const entryDiff =
      new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();

    if (entryDiff !== 0) {
      return entryDiff;
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function buildDashboardPendientes(hangars = [], aircraftByHangar = {}) {
  const seenAircraft = new Set();

  return buildAllPendientes(hangars, aircraftByHangar)
    .filter((item) => {
      if (seenAircraft.has(item.aircraftId)) {
        return false;
      }

      seenAircraft.add(item.aircraftId);
      return true;
    })
    .slice(0, 5);
}
