import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { Roboto_Condensed } from "next/font/google";
import { useEffect, useState } from "react";
import Header from "@/Components/common/Header";

const roboto_condensed = Roboto_Condensed({ weight: ["400", "700"], subsets: ["latin"] });

const EMPTY_AIRCRAFT_FORM = {
  registration: "",
  model: "",
  manufacturer: "",
  ownerPilot: "",
  entryReason: "",
  willPerformWork: "no",
  tasks: [],
  arrivalConditions: [],
};

const EMPTY_ITEM_DRAFT = { title: "", description: "" };

const normalizeItemList = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      title: (item?.title || "").trim(),
      description: (item?.description || "").trim(),
    }))
    .filter((item) => item.title || item.description);
};

const normalizeAircraft = (aircraft) => {
  const tasks = normalizeItemList(aircraft?.tasks);
  const arrivalConditions = normalizeItemList(aircraft?.arrivalConditions);
  const registration = (aircraft?.registration || aircraft?.id || "").trim();

  return {
    id: registration,
    registration,
    model: (aircraft?.model || "").trim(),
    manufacturer: (aircraft?.manufacturer || "").trim(),
    ownerPilot: (aircraft?.ownerPilot || "").trim(),
    entryReason: (aircraft?.entryReason || "").trim(),
    willPerformWork: aircraft?.willPerformWork === "si" || tasks.length > 0 ? "si" : "no",
    tasks,
    arrivalConditions,
    status: (aircraft?.status || "Registrada").trim(),
  };
};

const toPersistedAircraft = (form) => {
  const registration = form.registration.trim().toUpperCase();
  const tasks = form.willPerformWork === "si" ? normalizeItemList(form.tasks) : [];

  return {
    id: registration,
    registration,
    model: form.model.trim(),
    manufacturer: form.manufacturer.trim(),
    ownerPilot: form.ownerPilot.trim(),
    entryReason: form.entryReason.trim(),
    willPerformWork: form.willPerformWork,
    tasks,
    arrivalConditions: normalizeItemList(form.arrivalConditions),
    status: "Registrada",
  };
};

const toAircraftForm = (aircraft) => ({
  registration: aircraft.registration,
  model: aircraft.model,
  manufacturer: aircraft.manufacturer,
  ownerPilot: aircraft.ownerPilot,
  entryReason: aircraft.entryReason,
  willPerformWork: aircraft.willPerformWork,
  tasks: aircraft.tasks,
  arrivalConditions: aircraft.arrivalConditions,
});

export default function HangarDetailPage() {
  const router = useRouter();
  const { hangarId } = router.query;

  const [hangar, setHangar] = useState(null);
  const [aircraftList, setAircraftList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAircraftModalOpen, setIsAircraftModalOpen] = useState(false);
  const [aircraftModalMode, setAircraftModalMode] = useState("create");
  const [aircraftForm, setAircraftForm] = useState(EMPTY_AIRCRAFT_FORM);
  const [taskDraft, setTaskDraft] = useState(EMPTY_ITEM_DRAFT);
  const [conditionDraft, setConditionDraft] = useState(EMPTY_ITEM_DRAFT);
  const [editingAircraftId, setEditingAircraftId] = useState("");
  const [aircraftRequestError, setAircraftRequestError] = useState("");
  const [isSubmittingAircraft, setIsSubmittingAircraft] = useState(false);

  useEffect(() => {
    if (!hangarId || typeof hangarId !== "string") {
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [hangarResponse, aircraftResponse] = await Promise.all([
          fetch(`/api/hangars/${hangarId}`),
          fetch(`/api/hangars/${hangarId}/aircraft`),
        ]);

        if (!hangarResponse.ok || !aircraftResponse.ok) {
          throw new Error("No se pudo cargar la informacion del hangar.");
        }

        const hangarPayload = await hangarResponse.json();
        const aircraftPayload = await aircraftResponse.json();

        if (!isMounted) {
          return;
        }

        setHangar(hangarPayload.hangar || null);
        setAircraftList(
          Array.isArray(aircraftPayload.aircraftList)
            ? aircraftPayload.aircraftList.map(normalizeAircraft)
            : []
        );
      } catch {
        if (isMounted) {
          setError("No se pudo cargar la informacion del hangar.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [hangarId]);

  const handleAircraftFormChange = (field, value) => {
    setAircraftForm((prev) => {
      if (field === "willPerformWork" && value === "no") {
        return { ...prev, willPerformWork: "no", tasks: [] };
      }

      return { ...prev, [field]: value };
    });
  };

  const handleAddTask = () => {
    const nextTask = {
      title: taskDraft.title.trim(),
      description: taskDraft.description.trim(),
    };

    if (!nextTask.title || !nextTask.description) {
      return;
    }

    setAircraftForm((prev) => ({ ...prev, tasks: [...prev.tasks, nextTask] }));
    setTaskDraft(EMPTY_ITEM_DRAFT);
  };

  const handleRemoveTask = (indexToRemove) => {
    setAircraftForm((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleAddCondition = () => {
    const nextCondition = {
      title: conditionDraft.title.trim(),
      description: conditionDraft.description.trim(),
    };

    if (!nextCondition.title || !nextCondition.description) {
      return;
    }

    setAircraftForm((prev) => ({
      ...prev,
      arrivalConditions: [...prev.arrivalConditions, nextCondition],
    }));
    setConditionDraft(EMPTY_ITEM_DRAFT);
  };

  const handleRemoveCondition = (indexToRemove) => {
    setAircraftForm((prev) => ({
      ...prev,
      arrivalConditions: prev.arrivalConditions.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleOpenCreateAircraft = () => {
    setAircraftModalMode("create");
    setEditingAircraftId("");
    setAircraftForm(EMPTY_AIRCRAFT_FORM);
    setTaskDraft(EMPTY_ITEM_DRAFT);
    setConditionDraft(EMPTY_ITEM_DRAFT);
    setAircraftRequestError("");
    setIsAircraftModalOpen(true);
  };

  const handleOpenEditAircraft = (aircraft) => {
    setAircraftModalMode("edit");
    setEditingAircraftId(aircraft.id);
    setAircraftForm(toAircraftForm(aircraft));
    setTaskDraft(EMPTY_ITEM_DRAFT);
    setConditionDraft(EMPTY_ITEM_DRAFT);
    setAircraftRequestError("");
    setIsAircraftModalOpen(true);
  };

  const handleCloseAircraftModal = () => {
    setIsAircraftModalOpen(false);
    setAircraftRequestError("");
  };

  const handleSubmitAircraft = async (event) => {
    event.preventDefault();

    const payload = toPersistedAircraft(aircraftForm);

    if (!payload.registration || !payload.model || !payload.manufacturer || !payload.ownerPilot || !payload.entryReason) {
      setAircraftRequestError("Completa todos los campos obligatorios de la aeronave.");
      return;
    }

    if (payload.willPerformWork === "si" && payload.tasks.length === 0) {
      setAircraftRequestError("Si se realizaran trabajos, agrega al menos una tarea.");
      return;
    }

    if (aircraftModalMode === "create" && aircraftList.some((item) => item.id === payload.id)) {
      setAircraftRequestError("Ya existe una aeronave con esa matricula en este hangar.");
      return;
    }

    if (
      aircraftModalMode === "edit" &&
      aircraftList.some((item) => item.id === payload.id && item.id !== editingAircraftId)
    ) {
      setAircraftRequestError("La matricula ya esta en uso por otra aeronave del hangar.");
      return;
    }

    setIsSubmittingAircraft(true);
    setAircraftRequestError("");

    try {
      if (aircraftModalMode === "create") {
        const response = await fetch(`/api/hangars/${hangarId}/aircraft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aircraft: payload }),
        });

        if (!response.ok) {
          throw new Error("No se pudo crear la aeronave.");
        }

        setAircraftList((prev) => [normalizeAircraft(payload), ...prev]);
      } else {
        const response = await fetch(`/api/hangars/${hangarId}/aircraft/${editingAircraftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aircraft: payload }),
        });

        if (!response.ok) {
          throw new Error("No se pudo actualizar la aeronave.");
        }

        setAircraftList((prev) =>
          prev.map((item) => (item.id === editingAircraftId ? normalizeAircraft(payload) : item))
        );
      }

      handleCloseAircraftModal();
    } catch {
      setAircraftRequestError(
        aircraftModalMode === "create"
          ? "No se pudo guardar la aeronave. Intenta de nuevo."
          : "No se pudo actualizar la aeronave. Intenta de nuevo."
      );
    } finally {
      setIsSubmittingAircraft(false);
    }
  };

  const handleDeleteAircraft = async (aircraftId) => {
    try {
      const response = await fetch(`/api/hangars/${hangarId}/aircraft/${aircraftId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("No se pudo borrar la aeronave.");
      }

      setAircraftList((prev) => prev.filter((item) => item.id !== aircraftId));
    } catch {
      setAircraftRequestError("No se pudo borrar la aeronave. Intenta nuevamente.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-28 text-slate-900 sm:px-8 md:px-12">
      <div className="fixed left-0 top-0 z-50 w-screen">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className={`text-2xl font-bold text-slate-900 ${roboto_condensed.className}`}>Detalle de hangar</h1>
          <Link
            href="/inicio"
            className={`rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 ${roboto_condensed.className}`}
          >
            Volver a Inicio
          </Link>
        </div>

        {isLoading && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className={`text-slate-600 ${roboto_condensed.className}`}>Cargando informacion...</p>
          </section>
        )}

        {!isLoading && error && (
          <section className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className={`text-red-700 ${roboto_condensed.className}`}>{error}</p>
          </section>
        )}

        {!isLoading && !error && hangar && (
          <>
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-52 w-full sm:h-64">
                <Image
                  src={hangar.image}
                  alt={`Vista de ${hangar.label}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 1200px"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/70 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white sm:bottom-6 sm:left-6">
                  <p className={`text-xs uppercase tracking-[0.2em] text-slate-200 ${roboto_condensed.className}`}>{hangar.zoneTitle}</p>
                  <h2 className={`text-xl font-semibold sm:text-2xl ${roboto_condensed.className}`}>{hangar.label}</h2>
                  <p className={`text-sm text-slate-100 ${roboto_condensed.className}`}>{hangar.location || "Sin ubicacion"}</p>
                </div>
              </div>
              {hangar.description && (
                <div className="border-t border-slate-200 px-4 py-3">
                  <p className={`text-sm text-slate-600 ${roboto_condensed.className}`}>{hangar.description}</p>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className={`text-xl font-bold text-slate-800 ${roboto_condensed.className}`}>Aeronaves del hangar</h3>
                <button
                  type="button"
                  onClick={handleOpenCreateAircraft}
                  className={`rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 ${roboto_condensed.className}`}
                >
                  Agregar aeronave
                </button>
              </div>

              {aircraftRequestError && (
                <p className={`mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ${roboto_condensed.className}`}>
                  {aircraftRequestError}
                </p>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {aircraftList.map((aircraft) => (
                  <article key={aircraft.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <Link
                        href={`/hangar/${hangarId}/aeronave/${encodeURIComponent(aircraft.id)}`}
                        className="rounded-md transition hover:bg-slate-100 p-1 -m-1"
                      >
                        <p className={`text-xs font-semibold uppercase text-slate-500 ${roboto_condensed.className}`}>Matricula</p>
                        <p className={`text-sm font-bold text-slate-800 ${roboto_condensed.className}`}>{aircraft.registration || aircraft.id}</p>
                      </Link>
                      <div className="flex gap-1">
                        <Link
                          href={`/hangar/${hangarId}/aeronave/${encodeURIComponent(aircraft.id)}`}
                          className={`rounded-md bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-200 ${roboto_condensed.className}`}
                        >
                          Ver
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEditAircraft(aircraft)}
                          className={`rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAircraft(aircraft.id)}
                          className={`rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-200 ${roboto_condensed.className}`}
                        >
                          Borrar
                        </button>
                      </div>
                    </div>

                    <p className={`text-xs text-slate-600 ${roboto_condensed.className}`}>
                      <span className="font-semibold">Modelo:</span> {aircraft.model || "N/A"}
                    </p>
                    <p className={`text-xs text-slate-600 ${roboto_condensed.className}`}>
                      <span className="font-semibold">Fabricante:</span> {aircraft.manufacturer || "N/A"}
                    </p>
                    <p className={`text-xs text-slate-600 ${roboto_condensed.className}`}>
                      <span className="font-semibold">Responsable:</span> {aircraft.ownerPilot || "N/A"}
                    </p>
                    <p className={`text-xs text-slate-600 ${roboto_condensed.className}`}>
                      <span className="font-semibold">Motivo:</span> {aircraft.entryReason || "N/A"}
                    </p>

                    {aircraft.arrivalConditions.length > 0 && (
                      <div className="mt-2 rounded-md border border-slate-200 bg-white p-2">
                        <p className={`mb-1 text-xs font-semibold text-slate-700 ${roboto_condensed.className}`}>Estado de llegada</p>
                        {aircraft.arrivalConditions.map((condition, index) => (
                          <p key={`${aircraft.id}-condition-${index}`} className={`text-xs text-slate-600 ${roboto_condensed.className}`}>
                            {condition.title}: {condition.description}
                          </p>
                        ))}
                      </div>
                    )}

                    {aircraft.willPerformWork === "si" && aircraft.tasks.length > 0 && (
                      <div className="mt-2 rounded-md border border-cyan-200 bg-cyan-50 p-2">
                        <p className={`mb-1 text-xs font-semibold text-cyan-900 ${roboto_condensed.className}`}>Tareas a realizar</p>
                        {aircraft.tasks.map((task, index) => (
                          <p key={`${aircraft.id}-task-${index}`} className={`text-xs text-cyan-900 ${roboto_condensed.className}`}>
                            {task.title}: {task.description}
                          </p>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {aircraftList.length === 0 && (
                <p className={`mt-4 text-sm text-slate-500 ${roboto_condensed.className}`}>
                  No hay aeronaves registradas en este hangar.
                </p>
              )}
            </section>

            {isAircraftModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                  <h3 className={`mb-4 text-lg font-bold text-slate-900 ${roboto_condensed.className}`}>
                    {aircraftModalMode === "create" ? "Nueva aeronave" : "Editar aeronave"}
                  </h3>

                  <form onSubmit={handleSubmitAircraft} className="grid grid-cols-1 gap-3">
                    <input
                      value={aircraftForm.registration}
                      onChange={(event) => handleAircraftFormChange("registration", event.target.value)}
                      placeholder="Matricula de la aeronave"
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    />
                    <input
                      value={aircraftForm.model}
                      onChange={(event) => handleAircraftFormChange("model", event.target.value)}
                      placeholder="Modelo (Ej. 206)"
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    />
                    <input
                      value={aircraftForm.manufacturer}
                      onChange={(event) => handleAircraftFormChange("manufacturer", event.target.value)}
                      placeholder="Fabricante (Ej. Cessna)"
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    />
                    <input
                      value={aircraftForm.ownerPilot}
                      onChange={(event) => handleAircraftFormChange("ownerPilot", event.target.value)}
                      placeholder="Propietario / Piloto responsable"
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    />
                    <input
                      value={aircraftForm.entryReason}
                      onChange={(event) => handleAircraftFormChange("entryReason", event.target.value)}
                      placeholder="Motivo de ingreso"
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    />

                    <label className={`text-sm font-semibold text-slate-700 ${roboto_condensed.className}`}>
                      Se realizaran trabajos a la aeronave?
                    </label>
                    <select
                      value={aircraftForm.willPerformWork}
                      onChange={(event) => handleAircraftFormChange("willPerformWork", event.target.value)}
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    >
                      <option value="no">No</option>
                      <option value="si">Si</option>
                    </select>

                    {aircraftForm.willPerformWork === "si" && (
                      <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                        <p className={`mb-2 text-sm font-semibold text-cyan-900 ${roboto_condensed.className}`}>Lista de tareas</p>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          <input
                            value={taskDraft.title}
                            onChange={(event) => setTaskDraft((prev) => ({ ...prev, title: event.target.value }))}
                            placeholder="Tarea"
                            className={`rounded-md border border-cyan-300 px-2 py-1 text-xs outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                          />
                          <input
                            value={taskDraft.description}
                            onChange={(event) => setTaskDraft((prev) => ({ ...prev, description: event.target.value }))}
                            placeholder="Descripcion"
                            className={`rounded-md border border-cyan-300 px-2 py-1 text-xs outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                          />
                          <button
                            type="button"
                            onClick={handleAddTask}
                            className={`rounded-md bg-cyan-700 px-2 py-1 text-xs font-semibold text-white transition hover:bg-cyan-800 ${roboto_condensed.className}`}
                          >
                            Agregar tarea
                          </button>
                        </div>

                        <div className="mt-2 space-y-1">
                          {aircraftForm.tasks.map((task, index) => (
                            <div key={`task-${index}`} className="flex items-center justify-between rounded-md border border-cyan-200 bg-white px-2 py-1">
                              <p className={`text-xs text-cyan-900 ${roboto_condensed.className}`}>
                                {task.title}: {task.description}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleRemoveTask(index)}
                                className={`rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-200 ${roboto_condensed.className}`}
                              >
                                Quitar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className={`mb-2 text-sm font-semibold text-slate-800 ${roboto_condensed.className}`}>Estado de llegada</p>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <input
                          value={conditionDraft.title}
                          onChange={(event) => setConditionDraft((prev) => ({ ...prev, title: event.target.value }))}
                          placeholder="Condicion (Ej. Horas de vuelo)"
                          className={`rounded-md border border-slate-300 px-2 py-1 text-xs outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                        />
                        <input
                          value={conditionDraft.description}
                          onChange={(event) => setConditionDraft((prev) => ({ ...prev, description: event.target.value }))}
                          placeholder="Descripcion (Ej. 100 horas)"
                          className={`rounded-md border border-slate-300 px-2 py-1 text-xs outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                        />
                        <button
                          type="button"
                          onClick={handleAddCondition}
                          className={`rounded-md bg-slate-700 px-2 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 ${roboto_condensed.className}`}
                        >
                          Agregar condicion
                        </button>
                      </div>

                      <div className="mt-2 space-y-1">
                        {aircraftForm.arrivalConditions.map((condition, index) => (
                          <div key={`condition-${index}`} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2 py-1">
                            <p className={`text-xs text-slate-700 ${roboto_condensed.className}`}>
                              {condition.title}: {condition.description}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRemoveCondition(index)}
                              className={`rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-200 ${roboto_condensed.className}`}
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {aircraftRequestError && (
                      <p className={`rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ${roboto_condensed.className}`}>
                        {aircraftRequestError}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSubmittingAircraft}
                        className={`rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 ${roboto_condensed.className}`}
                      >
                        {isSubmittingAircraft ? "Guardando..." : "Guardar aeronave"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseAircraftModal}
                        className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
