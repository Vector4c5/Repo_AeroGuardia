export const REGISTRATION_TIMELINE_DAYS = 30;

export function buildRegistrationTimeline(
  aggregationResults = [],
  days = REGISTRATION_TIMELINE_DAYS
) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const countsByDate = new Map(
    aggregationResults.map((item) => [item._id, item.count])
  );

  const timeline = [];

  for (let index = 0; index < days; index += 1) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + index);
    const dateKey = currentDate.toISOString().split("T")[0];

    timeline.push({
      date: dateKey,
      count: countsByDate.get(dateKey) || 0,
    });
  }

  return timeline;
}

export function formatChartDate(value, options = {}) {
  const { short = false } = options;

  return new Date(`${value}T12:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: short ? "short" : "long",
  });
}

export function formatAdminDateTime(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Date(value).toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
