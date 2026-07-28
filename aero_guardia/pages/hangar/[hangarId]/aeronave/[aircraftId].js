import Link from "next/link";
import { useRouter } from "next/router";
import { Roboto_Condensed } from "next/font/google";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiCheck, FiFileText, FiPlus } from "react-icons/fi";

import AircraftReportPreview from "@/Components/aircraft/AircraftReportPreview";
import Header from "@/Components/common/Header";
import {
  buildAircraftReportData,
  downloadAircraftReportPdf,
  formatReportDateLong,
  formatReportDateTime,
  getReportPrintedBy,
  getTaskStatusLabel,
} from "@/lib/aircraftReport";
import { notifyError, notifySuccess } from "@/lib/notifications";
import {
  filterByPendingTaskType,
  getPendingTaskType,
  PENDING_TASK_TYPE_FILTER_ALL,
  PENDING_TASK_TYPE_FILTER_OPTIONS,
  PENDING_TASK_TYPES,
} from "@/lib/pendingTaskTypes";
import { buildDisplayName } from "@/lib/userProfile";

const roboto_condensed = Roboto_Condensed({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const EMPTY_PENDING_FORM = {
  title: "",
  description: "",
  taskType: PENDING_TASK_TYPES[0],
};

const EMPTY_OBSERVATION_FORM = {
  title: "",
  description: "",
};

const EMPTY_COMPLETE_FORM = {
  completedByName: "",
  completionNote: "",
};

const EMPTY_EXIT_FORM = {
  exitReportByName: "",
  exitNote: "",
};

const getTaskId = (task) => task?._id?.toString?.() || task?._id || "";

const InfoField = ({ label, value, className = "" }) => (
  <div className={`rounded-lg border border-slate-200 bg-slate-50 p-3 ${className}`}>
    <p
      className={`text-xs font-semibold uppercase text-slate-500 ${roboto_condensed.className}`}
    >
      {label}
    </p>
    <p className={`text-sm text-slate-800 ${roboto_condensed.className}`}>
      {value || "N/A"}
    </p>
  </div>
);

export default function AircraftDetailPage() {
  const router = useRouter();
  const { hangarId, aircraftId } = router.query;
  const { data: session, status } = useSession();

  const [hangar, setHangar] = useState(null);
  const [aircraft, setAircraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [taskTypeFilter, setTaskTypeFilter] = useState(
    PENDING_TASK_TYPE_FILTER_ALL
  );

  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [pendingForm, setPendingForm] = useState(EMPTY_PENDING_FORM);
  const [isSubmittingPending, setIsSubmittingPending] = useState(false);

  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [observationForm, setObservationForm] = useState(EMPTY_OBSERVATION_FORM);
  const [isSubmittingObservation, setIsSubmittingObservation] = useState(false);

  const [completeTask, setCompleteTask] = useState(null);
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE_FORM);
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);

  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [exitForm, setExitForm] = useState(EMPTY_EXIT_FORM);
  const [isSubmittingExit, setIsSubmittingExit] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const sessionDisplayName = useMemo(
    () =>
      buildDisplayName(session?.user?.firstNames, session?.user?.lastNames) ||
      session?.user?.name ||
      session?.user?.username ||
      "",
    [session]
  );

  const hangarName = hangar?.name || hangar?.label || "";
  const isDeparted = aircraft?.status === "Salida";

  const allPendingTasks = useMemo(
    () =>
      (aircraft?.maintenanceTasks || []).filter(
        (task) => task.status === "pending"
      ),
    [aircraft?.maintenanceTasks]
  );

  const hasOpenPendings = allPendingTasks.length > 0;
  const canRegisterExit = !isDeparted && !hasOpenPendings;

  const pendingTasks = useMemo(
    () => filterByPendingTaskType(allPendingTasks, taskTypeFilter),
    [allPendingTasks, taskTypeFilter]
  );

  const completedTasks = useMemo(
    () =>
      filterByPendingTaskType(
        (aircraft?.maintenanceTasks || []).filter(
          (task) => task.status === "completed"
        ),
        taskTypeFilter
      ),
    [aircraft?.maintenanceTasks, taskTypeFilter]
  );

  const reportData = useMemo(
    () =>
      buildAircraftReportData({
        aircraft,
        hangarName,
        printedBy: getReportPrintedBy(session),
      }),
    [aircraft, hangarName, session]
  );

  useEffect(() => {
    if (
      status !== "authenticated" ||
      !hangarId ||
      !aircraftId ||
      typeof hangarId !== "string" ||
      typeof aircraftId !== "string"
    ) {
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/hangars/${hangarId}/aircraft/${aircraftId}`
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error || "No se pudo cargar la información de la aeronave."
          );
        }

        if (!isMounted) {
          return;
        }

        setAircraft(payload.aircraft || null);
        setHangar(payload.hangar || null);
      } catch (loadError) {
        if (isMounted) {
          const message =
            loadError.message ||
            "No se pudo cargar la información de la aeronave.";
          setError(message);
          notifyError(message);
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
  }, [hangarId, aircraftId, status]);

  const patchAircraft = async (body) => {
    const response = await fetch(
      `/api/hangars/${hangarId}/aircraft/${aircraftId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo actualizar la aeronave.");
    }

    if (payload.aircraft) {
      setAircraft(payload.aircraft);
    }

    if (payload.hangar) {
      setHangar(payload.hangar);
    }

    return payload;
  };

  const handleOpenPendingModal = () => {
    setPendingForm(EMPTY_PENDING_FORM);
    setIsPendingModalOpen(true);
  };

  const handleSubmitPending = async (event) => {
    event.preventDefault();

    const title = pendingForm.title.trim();
    const description = pendingForm.description.trim();

    if (!title) {
      notifyError("El título del pendiente es obligatorio.");
      return;
    }

    setIsSubmittingPending(true);

    try {
      await patchAircraft({
        action: "add_pending_task",
        title,
        description,
        taskType: pendingForm.taskType,
      });
      notifySuccess("Pendiente agregado correctamente.");
      setIsPendingModalOpen(false);
    } catch (submitError) {
      notifyError(submitError.message || "No se pudo agregar el pendiente.");
    } finally {
      setIsSubmittingPending(false);
    }
  };

  const handleOpenObservationModal = () => {
    setObservationForm(EMPTY_OBSERVATION_FORM);
    setIsObservationModalOpen(true);
  };

  const handleSubmitObservation = async (event) => {
    event.preventDefault();

    const title = observationForm.title.trim();
    const description = observationForm.description.trim();

    if (!title) {
      notifyError("El título de la observación es obligatorio.");
      return;
    }

    setIsSubmittingObservation(true);

    try {
      await patchAircraft({
        action: "add_stay_observation",
        title,
        description,
      });
      notifySuccess("Observación agregada correctamente.");
      setIsObservationModalOpen(false);
    } catch (submitError) {
      notifyError(
        submitError.message || "No se pudo agregar la observación."
      );
    } finally {
      setIsSubmittingObservation(false);
    }
  };

  const handleOpenCompleteModal = (task) => {
    setCompleteTask(task);
    setCompleteForm({
      completedByName: sessionDisplayName,
      completionNote: "",
    });
  };

  const handleSubmitComplete = async (event) => {
    event.preventDefault();

    if (!completeTask) {
      return;
    }

    const completedByName = completeForm.completedByName.trim();
    const completionNote = completeForm.completionNote.trim();

    if (!completedByName || !completionNote) {
      notifyError("Completa el nombre y la descripción del trabajo realizado.");
      return;
    }

    setIsSubmittingComplete(true);

    try {
      await patchAircraft({
        action: "complete_task",
        taskId: getTaskId(completeTask),
        completedByName,
        completionNote,
      });
      notifySuccess("Pendiente marcado como terminado.");
      setCompleteTask(null);
    } catch (submitError) {
      notifyError(
        submitError.message || "No se pudo completar el pendiente."
      );
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  const handleOpenExitModal = () => {
    if (hasOpenPendings) {
      notifyError(
        `No se puede registrar la salida: hay ${allPendingTasks.length} pendiente${allPendingTasks.length === 1 ? "" : "s"} sin completar.`
      );
      return;
    }

    setExitForm({
      exitReportByName: sessionDisplayName,
      exitNote: "",
    });
    setIsExitModalOpen(true);
  };

  const handleSubmitExit = async (event) => {
    event.preventDefault();

    if (!canRegisterExit) {
      notifyError(
        `No se puede registrar la salida: hay ${allPendingTasks.length} pendiente${allPendingTasks.length === 1 ? "" : "s"} sin completar.`
      );
      return;
    }

    const exitReportByName = exitForm.exitReportByName.trim();
    const exitNote = exitForm.exitNote.trim();

    if (!exitReportByName || !exitNote) {
      notifyError("Completa el nombre y la descripción de la salida.");
      return;
    }

    setIsSubmittingExit(true);

    try {
      await patchAircraft({
        action: "register_exit",
        exitReportByName,
        exitNote,
      });
      notifySuccess("Salida registrada correctamente.");
      setIsExitModalOpen(false);
    } catch (submitError) {
      notifyError(submitError.message || "No se pudo registrar la salida.");
    } finally {
      setIsSubmittingExit(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportData) {
      notifyError("No hay datos suficientes para generar el reporte.");
      return;
    }

    setIsDownloadingPdf(true);

    try {
      await downloadAircraftReportPdf(reportData);
      notifySuccess("PDF descargado correctamente.");
    } catch (downloadError) {
      notifyError(
        downloadError.message || "No se pudo descargar el reporte PDF."
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const renderTaskCard = (task, index) => {
    const isCompleted = task.status === "completed";

    return (
      <div
        key={getTaskId(task) || `task-${index}`}
        className={`rounded-lg border p-3 ${
          isCompleted
            ? "border-slate-200 bg-slate-50"
            : "border-cyan-200 bg-cyan-50"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={`text-sm font-bold text-slate-800 ${roboto_condensed.className}`}
              >
                {task.title}
              </p>
              <span
                className={`rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 ${roboto_condensed.className}`}
              >
                {getPendingTaskType(task)}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isCompleted
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                } ${roboto_condensed.className}`}
              >
                {getTaskStatusLabel(task.status)}
              </span>
            </div>
            <p className={`text-sm text-slate-700 ${roboto_condensed.className}`}>
              {task.description || "Sin descripción"}
            </p>
            {isCompleted && (
              <div
                className={`space-y-1 text-xs text-slate-600 ${roboto_condensed.className}`}
              >
                <p>Realizado por: {task.completedByName || "—"}</p>
                <p>Cierre: {formatReportDateTime(task.completedAt)}</p>
                <p>Nota: {task.completionNote || "—"}</p>
              </div>
            )}
          </div>

          {!isCompleted && !isDeparted && (
            <button
              type="button"
              onClick={() => handleOpenCompleteModal(task)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 ${roboto_condensed.className}`}
            >
              <FiCheck className="h-4 w-4" />
              Completar
            </button>
          )}
        </div>
      </div>
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-100 px-5 py-28 text-slate-900 sm:px-8 md:px-12">
        <div className="fixed left-0 top-0 z-50 w-screen">
          <Header />
        </div>
        <main className="mx-auto w-full max-w-5xl">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className={`text-slate-600 ${roboto_condensed.className}`}>
              Verificando sesión...
            </p>
          </section>
        </main>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-slate-100 px-5 py-28 text-slate-900 sm:px-8 md:px-12">
        <div className="fixed left-0 top-0 z-50 w-screen">
          <Header />
        </div>
        <main className="mx-auto w-full max-w-5xl">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className={`mb-3 text-slate-700 ${roboto_condensed.className}`}>
              Debes iniciar sesión para ver el detalle de la aeronave.
            </p>
            <Link
              href="/login"
              className={`inline-flex rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 ${roboto_condensed.className}`}
            >
              Ir a iniciar sesión
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-28 text-slate-900 sm:px-8 md:px-12">
      <div className="fixed left-0 top-0 z-50 w-screen">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={`/hangar/${hangarId}`}
              className={`mb-2 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-800 ${roboto_condensed.className}`}
            >
              <FiArrowLeft className="h-4 w-4" />
              Volver al hangar
            </Link>
            <h1
              className={`text-2xl font-bold text-slate-900 ${roboto_condensed.className}`}
            >
              Detalle de aeronave
            </h1>
            <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
              {hangarName || "Hangar"}
            </p>
          </div>

          {!isLoading && !error && aircraft && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className={`inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 ${roboto_condensed.className}`}
              >
                <FiFileText className="h-4 w-4" />
                Reporte
              </button>
              {!isDeparted && (
                <button
                  type="button"
                  onClick={handleOpenExitModal}
                  disabled={!canRegisterExit}
                  title={
                    canRegisterExit
                      ? "Registrar salida"
                      : "Completa los pendientes antes de registrar la salida"
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    canRegisterExit
                      ? "bg-cyan-600 text-white hover:bg-cyan-700"
                      : "cursor-not-allowed bg-slate-200 text-slate-400"
                  } ${roboto_condensed.className}`}
                >
                  Registrar salida
                </button>
              )}
              {hasOpenPendings && !isDeparted && (
                <p
                  className={`w-full text-xs font-semibold text-amber-700 sm:w-auto ${roboto_condensed.className}`}
                >
                  {allPendingTasks.length} pendiente
                  {allPendingTasks.length === 1 ? "" : "s"} bloquean la salida
                </p>
              )}
            </div>
          )}
        </div>

        {isLoading && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className={`text-slate-600 ${roboto_condensed.className}`}>
              Cargando información...
            </p>
          </section>
        )}

        {!isLoading && error && (
          <section className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className={`text-red-700 ${roboto_condensed.className}`}>{error}</p>
            <Link
              href={`/hangar/${hangarId}`}
              className={`mt-3 inline-flex rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
            >
              Volver al hangar
            </Link>
          </section>
        )}

        {!isLoading && !error && aircraft && (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p
                    className={`text-xs uppercase tracking-[0.2em] text-slate-500 ${roboto_condensed.className}`}
                  >
                    {hangarName || "Hangar"}
                  </p>
                  <h2
                    className={`mt-1 text-xl font-bold text-slate-800 sm:text-2xl ${roboto_condensed.className}`}
                  >
                    Matrícula: {aircraft.registration || "N/A"}
                  </h2>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    isDeparted
                      ? "bg-slate-200 text-slate-700"
                      : "bg-cyan-100 text-cyan-800"
                  } ${roboto_condensed.className}`}
                >
                  {aircraft.status || "En hangar"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoField label="Fabricante" value={aircraft.manufacturer} />
                <InfoField label="Modelo" value={aircraft.model} />
                <InfoField label="N° Serie" value={aircraft.serialNumber} />
                <InfoField label="Tipo" value={aircraft.aircraftType} />
                <InfoField
                  label="Razón de estancia"
                  value={aircraft.stayReason}
                />
                <InfoField
                  label="Fecha de ingreso"
                  value={formatReportDateLong(aircraft.entryDate)}
                />
                <InfoField
                  label="Reporte de ingreso"
                  value={aircraft.intakeReportByName}
                />
              </div>
            </section>

            {isDeparted && (
              <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm sm:p-6">
                <h3
                  className={`mb-3 text-lg font-bold text-slate-800 ${roboto_condensed.className}`}
                >
                  Información de salida
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoField
                    label="Fecha de salida"
                    value={formatReportDateLong(aircraft.exitDate)}
                  />
                  <InfoField
                    label="Registrado por"
                    value={aircraft.exitReportByName}
                  />
                  <InfoField
                    label="Nota de salida"
                    value={aircraft.exitNote}
                    className="sm:col-span-2"
                  />
                </div>
              </section>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h3
                className={`mb-3 text-lg font-bold text-slate-800 ${roboto_condensed.className}`}
              >
                Condiciones de llegada
              </h3>
              {Array.isArray(aircraft.arrivalConditions) &&
              aircraft.arrivalConditions.length > 0 ? (
                <div className="space-y-2">
                  {aircraft.arrivalConditions.map((condition, index) => (
                    <div
                      key={condition._id || `condition-${index}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <p
                        className={`text-xs font-semibold uppercase text-slate-500 ${roboto_condensed.className}`}
                      >
                        {condition.title}
                      </p>
                      <p
                        className={`text-sm text-slate-800 ${roboto_condensed.className}`}
                      >
                        {condition.description || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
                  No hay condiciones registradas.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3
                  className={`text-lg font-bold text-slate-800 ${roboto_condensed.className}`}
                >
                  Observaciones de estancia
                </h3>
                <button
                  type="button"
                  onClick={handleOpenObservationModal}
                  disabled={isDeparted}
                  className={`inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 ${roboto_condensed.className}`}
                >
                  <FiPlus className="h-4 w-4" />
                  Agregar observación
                </button>
              </div>

              {Array.isArray(aircraft.stayObservations) &&
              aircraft.stayObservations.length > 0 ? (
                <div className="space-y-2">
                  {aircraft.stayObservations.map((observation, index) => (
                    <div
                      key={observation._id || `observation-${index}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <p
                        className={`text-xs font-semibold uppercase text-slate-500 ${roboto_condensed.className}`}
                      >
                        {observation.title}
                      </p>
                      <p
                        className={`text-sm text-slate-800 ${roboto_condensed.className}`}
                      >
                        {observation.description || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
                  No hay observaciones registradas.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3
                  className={`text-lg font-bold text-slate-800 ${roboto_condensed.className}`}
                >
                  Pendientes de mantenimiento
                </h3>
                <button
                  type="button"
                  onClick={handleOpenPendingModal}
                  disabled={isDeparted}
                  className={`inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 ${roboto_condensed.className}`}
                >
                  <FiPlus className="h-4 w-4" />
                  Agregar pendiente
                </button>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="task-type-filter"
                  className={`mb-1.5 block text-sm font-semibold text-slate-700 ${roboto_condensed.className}`}
                >
                  Filtrar por tipo
                </label>
                <select
                  id="task-type-filter"
                  value={taskTypeFilter}
                  onChange={(event) => setTaskTypeFilter(event.target.value)}
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 sm:max-w-xs ${roboto_condensed.className}`}
                >
                  {PENDING_TASK_TYPE_FILTER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-5">
                <div>
                  <h4
                    className={`mb-2 text-sm font-bold uppercase tracking-wide text-amber-700 ${roboto_condensed.className}`}
                  >
                    Activos ({pendingTasks.length})
                  </h4>
                  {pendingTasks.length > 0 ? (
                    <div className="space-y-2">
                      {pendingTasks.map((task, index) =>
                        renderTaskCard(task, index)
                      )}
                    </div>
                  ) : (
                    <p
                      className={`text-sm text-slate-500 ${roboto_condensed.className}`}
                    >
                      No hay pendientes activos para el filtro seleccionado.
                    </p>
                  )}
                </div>

                <div>
                  <h4
                    className={`mb-2 text-sm font-bold uppercase tracking-wide text-slate-600 ${roboto_condensed.className}`}
                  >
                    Terminados ({completedTasks.length})
                  </h4>
                  {completedTasks.length > 0 ? (
                    <div className="space-y-2">
                      {completedTasks.map((task, index) =>
                        renderTaskCard(task, `done-${index}`)
                      )}
                    </div>
                  ) : (
                    <p
                      className={`text-sm text-slate-500 ${roboto_condensed.className}`}
                    >
                      No hay pendientes terminados para el filtro seleccionado.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {Array.isArray(aircraft.reports) && aircraft.reports.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <h3
                  className={`mb-3 text-lg font-bold text-slate-800 ${roboto_condensed.className}`}
                >
                  Reportes
                </h3>
                <div className="space-y-2">
                  {aircraft.reports.map((report, index) => (
                    <div
                      key={report._id || `report-${index}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <p
                        className={`text-sm font-bold text-slate-800 ${roboto_condensed.className}`}
                      >
                        {report.title}
                      </p>
                      <p
                        className={`text-sm text-slate-700 ${roboto_condensed.className}`}
                      >
                        {report.notes || "—"}
                      </p>
                      {report.createdAt && (
                        <p
                          className={`mt-1 text-xs text-slate-500 ${roboto_condensed.className}`}
                        >
                          {formatReportDateTime(report.createdAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {isPendingModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                  <h3
                    className={`mb-4 text-lg font-bold text-slate-900 ${roboto_condensed.className}`}
                  >
                    Agregar pendiente
                  </h3>
                  <form onSubmit={handleSubmitPending} className="grid gap-3">
                    <input
                      value={pendingForm.title}
                      onChange={(event) =>
                        setPendingForm((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Título"
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    />
                    <select
                      value={pendingForm.taskType}
                      onChange={(event) =>
                        setPendingForm((prev) => ({
                          ...prev,
                          taskType: event.target.value,
                        }))
                      }
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    >
                      {PENDING_TASK_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={pendingForm.description}
                      onChange={(event) =>
                        setPendingForm((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Descripción"
                      rows={3}
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={isSubmittingPending}
                        className={`rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-70 ${roboto_condensed.className}`}
                      >
                        {isSubmittingPending ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPendingModalOpen(false)}
                        disabled={isSubmittingPending}
                        className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isObservationModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                  <h3
                    className={`mb-4 text-lg font-bold text-slate-900 ${roboto_condensed.className}`}
                  >
                    Agregar observación
                  </h3>
                  <form
                    onSubmit={handleSubmitObservation}
                    className="grid gap-3"
                  >
                    <input
                      value={observationForm.title}
                      onChange={(event) =>
                        setObservationForm((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Título"
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    />
                    <textarea
                      value={observationForm.description}
                      onChange={(event) =>
                        setObservationForm((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Descripción"
                      rows={3}
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={isSubmittingObservation}
                        className={`rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-70 ${roboto_condensed.className}`}
                      >
                        {isSubmittingObservation ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsObservationModalOpen(false)}
                        disabled={isSubmittingObservation}
                        className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {completeTask && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                  <h3
                    className={`mb-1 text-lg font-bold text-slate-900 ${roboto_condensed.className}`}
                  >
                    Completar pendiente
                  </h3>
                  <p
                    className={`mb-4 text-sm text-slate-500 ${roboto_condensed.className}`}
                  >
                    {completeTask.title}
                  </p>
                  <form onSubmit={handleSubmitComplete} className="grid gap-3">
                    <input
                      value={completeForm.completedByName}
                      onChange={(event) =>
                        setCompleteForm((prev) => ({
                          ...prev,
                          completedByName: event.target.value,
                        }))
                      }
                      placeholder="Realizado por"
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    />
                    <textarea
                      value={completeForm.completionNote}
                      onChange={(event) =>
                        setCompleteForm((prev) => ({
                          ...prev,
                          completionNote: event.target.value,
                        }))
                      }
                      placeholder="Descripción del trabajo realizado"
                      rows={3}
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={isSubmittingComplete}
                        className={`rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70 ${roboto_condensed.className}`}
                      >
                        {isSubmittingComplete
                          ? "Guardando..."
                          : "Marcar terminado"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompleteTask(null)}
                        disabled={isSubmittingComplete}
                        className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isExitModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                  <h3
                    className={`mb-4 text-lg font-bold text-slate-900 ${roboto_condensed.className}`}
                  >
                    Registrar salida
                  </h3>
                  <form onSubmit={handleSubmitExit} className="grid gap-3">
                    <input
                      value={exitForm.exitReportByName}
                      onChange={(event) =>
                        setExitForm((prev) => ({
                          ...prev,
                          exitReportByName: event.target.value,
                        }))
                      }
                      placeholder="Registrado por"
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    />
                    <textarea
                      value={exitForm.exitNote}
                      onChange={(event) =>
                        setExitForm((prev) => ({
                          ...prev,
                          exitNote: event.target.value,
                        }))
                      }
                      placeholder="Descripción breve de la salida"
                      rows={3}
                      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={isSubmittingExit}
                        className={`rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-70 ${roboto_condensed.className}`}
                      >
                        {isSubmittingExit ? "Registrando..." : "Confirmar salida"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsExitModalOpen(false)}
                        disabled={isSubmittingExit}
                        className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isReportModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3
                      className={`text-lg font-bold text-slate-900 ${roboto_condensed.className}`}
                    >
                      Vista previa del reporte
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isDownloadingPdf || !reportData}
                        className={`rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-70 ${roboto_condensed.className}`}
                      >
                        {isDownloadingPdf ? "Descargando..." : "Descargar PDF"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsReportModalOpen(false)}
                        className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                  <div className="overflow-y-auto p-4">
                    <AircraftReportPreview reportData={reportData} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
