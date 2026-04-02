import Link from "next/link";

const sectionTemplates = [
  {
    title: "Operaciones",
    description: "Panel de control de operaciones del hangar.",
    tab: "operaciones",
    hoverShadow: "hover:shadow-cyan-400/70",
  },
  {
    title: "Incidentes",
    description: "Registro rapido de novedades y eventos de seguridad.",
    tab: "incidentes",
    hoverShadow: "hover:shadow-rose-400/70",
  },
  {
    title: "Reportes",
    description: "Resumen diario con metricas y tareas pendientes.",
    tab: "reportes",
    hoverShadow: "hover:shadow-amber-400/70",
  },
  {
    title: "Mantenimiento",
    description: "Calendario tecnico y checklist de aeronaves.",
    tab: "mantenimiento",
    hoverShadow: "hover:shadow-emerald-400/70",
  },
];

const hangars = [
  {
    id: "hangar-1",
    label: "Hangar Principal",
    zoneTitle: "Hangar de mantenimietno",
    image: "/Hangar_Mantenimiento.jpg",
    aircraftList: [
      { id: "AG-101", model: "Boeing 737-800", status: "Listo" },
      { id: "AG-224", model: "Airbus A320", status: "En revision" },
      { id: "AG-315", model: "Cessna 208", status: "En mantenimiento" },
      { id: "AG-402", model: "Embraer 190", status: "Listo" },
    ],
  },
  {
    id: "hangar-2",
    label: "Hangar Norte",
    zoneTitle: "Escuela de aviacion y entrenamiento",
    image: "/Hangar_Escuela.jpg",
    aircraftList: [
      { id: "AG-510", model: "Airbus A321", status: "Listo" },
      { id: "AG-588", model: "Boeing 767", status: "En revision" },
      { id: "AG-603", model: "ATR 72", status: "Pendiente" },
      { id: "AG-640", model: "Embraer 195", status: "Listo" },
    ],
  },
  {
    id: "hangar-3",
    label: "Hangar Sur",
    zoneTitle: "Hangar de almacenamiento y operaciones",
    image: "/Hangar_Almacenamiento.jpg",
    aircraftList: [
      { id: "AG-701", model: "Boeing 787", status: "En mantenimiento" },
      { id: "AG-722", model: "Airbus A330", status: "En revision" },
      { id: "AG-745", model: "Cessna Citation", status: "Listo" },
      { id: "AG-780", model: "Boeing 737 MAX", status: "Listo" },
    ],
  },
];

export default function Inicio() {
  return (
    <div className="min-h-screen bg-slate-100 px-5 py-6 text-slate-900 sm:px-8 md:px-12">
      <header className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-semibold sm:text-xl">AeroGuardia Classroom</h1>

        <details className="relative">
          <summary
            aria-label="Abrir menu"
            className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-300 bg-slate-50 transition hover:bg-slate-100"
          >
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-700"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-700"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-700"></span>
            </span>
          </summary>

          <div className="absolute right-0 top-12 z-20 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <button type="button" className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100">
              Perfil
            </button>
            <button type="button" className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100">
              Ajustes
            </button>
            <button type="button" className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100">
              Notificaciones
            </button>
            <button type="button" className="w-full rounded-md px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
              Cerrar sesion
            </button>
          </div>
        </details>
      </header>

      <Link
        href="/control_acceso_personal"
        className="mx-auto mb-8 flex w-full max-w-md items-center justify-center rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-4 text-center text-lg font-semibold text-white shadow-xl shadow-sky-500/30 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/70"
      >
        <p className="tracking-wide">
          Control de Acceso Personal
        </p>
      </Link>

      <main className="mx-auto w-full max-w-6xl space-y-8">
        {hangars.map((hangar) => (
          <section key={hangar.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-52 w-full sm:h-64">
              <img
                src={hangar.image}
                alt={`Vista de ${hangar.label}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/70 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white sm:bottom-6 sm:left-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-200">{hangar.label}</p>
                <h2 className="text-xl font-semibold sm:text-2xl">{hangar.zoneTitle}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {hangar.aircraftList.map((aircraft) => (
                <article key={`${hangar.id}-${aircraft.id}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">{aircraft.id}</p>
                  <p className="text-sm font-medium text-slate-800">{aircraft.model}</p>
                  <p className="text-xs text-slate-600">Estado: {aircraft.status}</p>
                </article>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {sectionTemplates.map((section) => (
                <Link
                  key={`${hangar.id}-${section.title}`}
                  href={`/inicio?hangar=${hangar.id}&tab=${section.tab}`}
                  className={`group rounded-xl border border-slate-200 bg-white p-5 shadow-md transition duration-300 hover:scale-[1.03] hover:shadow-xl ${section.hoverShadow}`}
                >
                  <h3 className="mb-2 text-lg font-semibold text-slate-800">{section.title}</h3>
                  <p className="text-sm text-slate-600">{section.description}</p>
                  <span className="mt-4 inline-block text-sm font-medium text-slate-700 transition group-hover:text-slate-900">
                    Abrir apartado
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}