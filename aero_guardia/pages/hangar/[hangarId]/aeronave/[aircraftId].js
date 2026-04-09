import Link from "next/link";
import { useRouter } from "next/router";
import { Roboto_Condensed } from "next/font/google";
import { useEffect, useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import Header from "@/Components/common/Header";

const roboto_condensed = Roboto_Condensed({ weight: ["400", "700"], subsets: ["latin"] });

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

  return {
    id: (aircraft?.id || "").trim(),
    registration: (aircraft?.registration || aircraft?.id || "").trim(),
    model: (aircraft?.model || "").trim(),
    manufacturer: (aircraft?.manufacturer || "").trim(),
    ownerPilot: (aircraft?.ownerPilot || "").trim(),
    entryReason: (aircraft?.entryReason || "").trim(),
    willPerformWork: aircraft?.willPerformWork === "si" || tasks.length > 0 ? "si" : "no",
    tasks,
    arrivalConditions: normalizeItemList(aircraft?.arrivalConditions),
    status: (aircraft?.status || "Registrada").trim(),
  };
};

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

export default function AircraftDetailPage() {
  const router = useRouter();
  const { hangarId, aircraftId } = router.query;

  const [hangar, setHangar] = useState(null);
  const [aircraft, setAircraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [aircraftForm, setAircraftForm] = useState(EMPTY_AIRCRAFT_FORM);
  const [taskDraft, setTaskDraft] = useState(EMPTY_ITEM_DRAFT);
  const [conditionDraft, setConditionDraft] = useState(EMPTY_ITEM_DRAFT);
  const [aircraftRequestError, setAircraftRequestError] = useState("");
  const [isSubmittingAircraft, setIsSubmittingAircraft] = useState(false);

  useEffect(() => {
    if (!hangarId || !aircraftId || typeof hangarId !== "string" || typeof aircraftId !== "string") {
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [hangarResponse, aircraftResponse] = await Promise.all([
          fetch(`/api/hangars/${hangarId}`),
          fetch(`/api/hangars/${hangarId}/aircraft/${aircraftId}`),
        ]);

        if (!hangarResponse.ok || !aircraftResponse.ok) {
          throw new Error("No se pudo cargar la informacion de la aeronave.");
        }

        const hangarPayload = await hangarResponse.json();
        const aircraftPayload = await aircraftResponse.json();

        if (!isMounted) {
          return;
        }

        setHangar(hangarPayload.hangar || null);
        setAircraft(normalizeAircraft(aircraftPayload.aircraft || {}));
      } catch {
        if (isMounted) {
          setError("No se pudo cargar la informacion de la aeronave.");
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
  }, [hangarId, aircraftId]);

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

  const handleOpenEditModal = () => {
    if (!aircraft) {
      return;
    }

    setAircraftForm(toAircraftForm(aircraft));
    setTaskDraft(EMPTY_ITEM_DRAFT);
    setConditionDraft(EMPTY_ITEM_DRAFT);
    setAircraftRequestError("");
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
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

    setIsSubmittingAircraft(true);
    setAircraftRequestError("");

    try {
      const response = await fetch(`/api/hangars/${hangarId}/aircraft/${aircraftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aircraft: payload }),
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar la aeronave.");
      }

      setAircraft(normalizeAircraft(payload));
      handleCloseEditModal();

      if (payload.id !== aircraftId) {
        router.replace(`/hangar/${hangarId}/aeronave/${encodeURIComponent(payload.id)}`);
      }
    } catch {
      setAircraftRequestError("No se pudo actualizar la aeronave. Intenta de nuevo.");
    } finally {
      setIsSubmittingAircraft(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-28 text-slate-900 sm:px-8 md:px-12">
      <div className="fixed left-0 top-0 z-50 w-screen">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-bold text-slate-900 ${roboto_condensed.className}`}>Detalle de aeronave</h1>
            <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
              {hangar?.label || "Hangar"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/hangar/${hangarId}`}
              className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
            >
              Volver al hangar
            </Link>
            <button
              type="button"
              onClick={handleOpenEditModal}
              className={`inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 ${roboto_condensed.className}`}
            >
              <FiEdit2 className="h-4 w-4" />
              Editar aeronave
            </button>
          </div>
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

        {!isLoading && !error && aircraft && (
          <>
            {isEditModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                  <h3 className={`mb-4 text-lg font-bold text-slate-900 ${roboto_condensed.className}`}>
                    Editar aeronave
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
                        className={`rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70 ${roboto_condensed.className}`}
                      >
                        {isSubmittingAircraft ? "Guardando..." : "Actualizar aeronave"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseEditModal}
                        className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <p className={`text-xs uppercase tracking-[0.2em] text-slate-500 ${roboto_condensed.className}`}>
                {hangar?.label || "Hangar"}
              </p>
              <h2 className={`mt-1 text-xl font-bold text-slate-800 sm:text-2xl ${roboto_condensed.className}`}>
                Matricula: {aircraft.registration || aircraft.id}
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className={`text-xs font-semibold uppercase text-slate-500 ${roboto_condensed.className}`}>Modelo</p>
                  <p className={`text-sm text-slate-800 ${roboto_condensed.className}`}>{aircraft.model || "N/A"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className={`text-xs font-semibold uppercase text-slate-500 ${roboto_condensed.className}`}>Fabricante</p>
                  <p className={`text-sm text-slate-800 ${roboto_condensed.className}`}>{aircraft.manufacturer || "N/A"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className={`text-xs font-semibold uppercase text-slate-500 ${roboto_condensed.className}`}>Responsable</p>
                  <p className={`text-sm text-slate-800 ${roboto_condensed.className}`}>{aircraft.ownerPilot || "N/A"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className={`text-xs font-semibold uppercase text-slate-500 ${roboto_condensed.className}`}>Motivo de ingreso</p>
                  <p className={`text-sm text-slate-800 ${roboto_condensed.className}`}>{aircraft.entryReason || "N/A"}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h3 className={`mb-3 text-lg font-bold text-slate-800 ${roboto_condensed.className}`}>Estado de llegada</h3>
              {aircraft.arrivalConditions.length > 0 ? (
                <div className="space-y-2">
                  {aircraft.arrivalConditions.map((condition, index) => (
                    <div key={`condition-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className={`text-xs font-semibold uppercase text-slate-500 ${roboto_condensed.className}`}>{condition.title}</p>
                      <p className={`text-sm text-slate-800 ${roboto_condensed.className}`}>{condition.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>No hay condiciones registradas.</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h3 className={`mb-3 text-lg font-bold text-slate-800 ${roboto_condensed.className}`}>Trabajos a realizar</h3>
              <p className={`mb-3 text-sm text-slate-700 ${roboto_condensed.className}`}>
                Se realizaran trabajos: {aircraft.willPerformWork === "si" ? "Si" : "No"}
              </p>

              {aircraft.willPerformWork === "si" ? (
                aircraft.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {aircraft.tasks.map((task, index) => (
                      <div key={`task-${index}`} className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                        <p className={`text-xs font-semibold uppercase text-cyan-800 ${roboto_condensed.className}`}>{task.title}</p>
                        <p className={`text-sm text-cyan-900 ${roboto_condensed.className}`}>{task.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>No hay tareas registradas.</p>
                )
              ) : (
                <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
                  Esta aeronave no tiene trabajos pendientes registrados.
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
