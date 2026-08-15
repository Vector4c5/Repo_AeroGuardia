import Link from "next/link";
import { useRouter } from "next/router";
import { Roboto_Condensed, Montserrat } from "next/font/google";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiCheck, FiFileText, FiPlus, FiClock } from "react-icons/fi";
import { FaClipboardList, FaCircleCheck, FaPlaneDeparture } from "react-icons/fa6";

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
const heading = Montserrat({ weight: ["700", "800"], subsets: ["latin"] });

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

const diffDays = (fromValue, toValue) => {
  const from = new Date(fromValue);
  const to = toValue ? new Date(toValue) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};

const inputCls = `rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-royal/30 focus:ring-2 ${roboto_condensed.className}`;
const btnPrimary = `rounded-xl bg-gradient-to-r from-navy to-royal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-70 ${roboto_condensed.className}`;
const btnGray = `rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-70 ${roboto_condensed.className}`;

function Kicker({ children, tone = "royal" }) {
  const toneCls = tone === "light" ? "text-slate-200" : "text-royal";
  return (
    <p className={`text-xs font-bold uppercase tracking-[0.2em] ${toneCls} ${roboto_condensed.className}`}>
      {children}
    </p>
  );
}

const STAT_ACCENTS = {
  royal: "bg-royal shadow-royal/20",
  sky: "bg-sky shadow-sky/20",
  gold: "bg-gold shadow-gold/20",
};

function StatCard({ icon, label, value, accent = "royal", tone = "default" }) {
  const toneCls =
    tone === "warning"
      ? "border-gold bg-white shadow-lg shadow-gold/50"
      : "border-slate-200 bg-white shadow-sm";
  return (
    <div className={`flex items-center gap-2 rounded-2xl border p-2 sm:gap-3 sm:p-4 ${toneCls}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base text-white shadow-md sm:h-12 sm:w-12 sm:text-xl ${STAT_ACCENTS[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-xl font-bold leading-none text-navy sm:text-3xl ${heading.className}`}>{value}</p>
        <p className={`mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-sm ${roboto_condensed.className}`}>{label}</p>
      </div>
    </div>
  );
}

const InfoField = ({ label, value, className = "" }) => (
  <div className={`rounded-xl border border-slate-200 bg-mist/60 p-3 ${className}`}>
    <p
      className={`text-[11px] font-semibold uppercase tracking-wide text-royal ${roboto_condensed.className}`}
    >
      {label}
    </p>
    <p className={`mt-0.5 text-sm font-semibold text-navy ${roboto_condensed.className}`}>
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
  const canRegisterExit = !isDeparted;

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

  const tableTasks = useMemo(
    () => [...pendingTasks, ...completedTasks],
    [pendingTasks, completedTasks]
  );

  const completedTaskCount = useMemo(
    () =>
      (aircraft?.maintenanceTasks || []).filter(
        (task) => task.status === "completed"
      ).length,
    [aircraft?.maintenanceTasks]
  );

  const stayDays = useMemo(() => {
    if (!aircraft?.entryDate) return null;
    return diffDays(aircraft.entryDate, isDeparted ? aircraft.exitDate : null);
  }, [aircraft?.entryDate, aircraft?.exitDate, isDeparted]);

  const timelineObservations = useMemo(
    () => [...(aircraft?.stayObservations || [])].reverse(),
    [aircraft?.stayObservations]
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
    setExitForm({
      exitReportByName: sessionDisplayName,
      exitNote: "",
    });
    setIsExitModalOpen(true);
  };

  const handleSubmitExit = async (event) => {
    event.preventDefault();

    if (!canRegisterExit) {
      notifyError("Esta aeronave ya fue registrada como salida.");
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

  const renderTaskRow = (task, index) => {
    const isCompleted = task.status === "completed";

    return (
      <tr
        key={getTaskId(task) || `task-${index}`}
        className={isCompleted ? "bg-white" : "bg-gold/5"}
      >
        <td className={`px-3 py-3 align-top text-sm font-bold text-navy ${roboto_condensed.className}`}>
          {task.title}
        </td>
        <td className="px-3 py-3 align-top">
          <span
            className={`inline-block whitespace-nowrap rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-slate-700 ${roboto_condensed.className}`}
          >
            {getPendingTaskType(task)}
          </span>
        </td>
        <td className={`px-3 py-3 align-top text-sm text-slate-700 ${roboto_condensed.className}`}>
          {task.description || "Sin descripción"}
          {isCompleted && (
            <div className={`mt-1 space-y-0.5 text-xs text-slate-500 ${roboto_condensed.className}`}>
              <p>Realizado por: {task.completedByName || "—"}</p>
              <p>Cierre: {formatReportDateTime(task.completedAt)}</p>
              {task.completionNote && <p>Nota: {task.completionNote}</p>}
            </div>
          )}
        </td>
        <td className="px-3 py-3 align-top">
          <span
            className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${
              isCompleted
                ? "bg-emerald-100 text-emerald-800"
                : "bg-gold/20 text-amber-800"
            } ${roboto_condensed.className}`}
          >
            {getTaskStatusLabel(task.status)}
          </span>
        </td>
        <td className="px-3 py-3 align-top text-right">
          {!isCompleted && !isDeparted && (
            <button
              type="button"
              onClick={() => handleOpenCompleteModal(task)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 ${roboto_condensed.className}`}
            >
              <FiCheck className="h-3.5 w-3.5" />
              Completar
            </button>
          )}
        </td>
      </tr>
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-mist px-5 py-28 text-slate-900 sm:px-8 md:px-12">
        <div className="fixed left-0 top-0 z-50 w-screen">
          <Header />
        </div>
        <main className="mx-auto w-full max-w-5xl">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
      <div className="min-h-screen bg-mist px-5 py-28 text-slate-900 sm:px-8 md:px-12">
        <div className="fixed left-0 top-0 z-50 w-screen">
          <Header />
        </div>
        <main className="mx-auto w-full max-w-5xl">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className={`mb-3 text-slate-700 ${roboto_condensed.className}`}>
              Debes iniciar sesión para ver el detalle de la aeronave.
            </p>
            <Link href="/login" className={btnPrimary}>
              Ir a iniciar sesión
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist px-5 py-28 text-slate-900 sm:px-8 md:px-12">
      <div className="fixed left-0 top-0 z-50 w-screen">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/hangar/${hangarId}`}
            className={`inline-flex w-fit items-center gap-2 text-sm font-semibold text-royal transition hover:text-navy ${roboto_condensed.className}`}
          >
            <FiArrowLeft className="h-4 w-4" />
            Volver al hangar
          </Link>

          {!isLoading && !error && aircraft && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className={`inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-base font-bold text-white shadow-md shadow-navy/25 transition hover:bg-slate-800 hover:shadow-lg ${roboto_condensed.className}`}
              >
                <FiFileText className="h-5 w-5" />
                Reporte
              </button>
              {!isDeparted && (
                <button
                  type="button"
                  onClick={handleOpenExitModal}
                  disabled={!canRegisterExit}
                  title={hasOpenPendings ? "Hay pendientes activos — se pedirá confirmación" : "Registrar salida"}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white shadow-md transition hover:brightness-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none ${
                    hasOpenPendings ? "bg-gradient-to-r from-gold to-amber-600 shadow-gold/30" : "bg-royal shadow-royal/25"
                  } ${roboto_condensed.className}`}
                >
                  <FaPlaneDeparture className="h-5 w-5" />
                  Registrar salida
                </button>
              )}
            </div>
          )}
        </div>

        {isLoading && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className={`text-slate-600 ${roboto_condensed.className}`}>
              Cargando información...
            </p>
          </section>
        )}

        {!isLoading && error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className={`text-red-700 ${roboto_condensed.className}`}>{error}</p>
            <Link href={`/hangar/${hangarId}`} className={`mt-3 inline-flex ${btnGray}`}>
              Volver al hangar
            </Link>
          </section>
        )}

        {!isLoading && !error && aircraft && (
          <>
            {/* Hero de identidad + resumen de salud */}
            <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-royal shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-6">
                <div className="min-w-0">
                  <Kicker tone="light">{hangarName || "Hangar"}</Kicker>
                  <h1
                    className={`mt-1 truncate text-3xl text-white sm:text-4xl ${heading.className}`}
                  >
                    {aircraft.registration || "N/A"}
                  </h1>
                  <p className={`mt-1 text-sm text-white/80 sm:text-base ${roboto_condensed.className}`}>
                    {[aircraft.manufacturer, aircraft.model].filter(Boolean).join(" · ") || "Sin modelo"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
                    isDeparted ? "bg-white/15 text-white" : "bg-white text-navy"
                  } ${roboto_condensed.className}`}
                >
                  {aircraft.status || "En hangar"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 backdrop-blur-sm sm:gap-4 sm:p-4">
                <StatCard
                  icon={<FaClipboardList />}
                  label="Pendientes"
                  value={allPendingTasks.length}
                  accent="gold"
                />
                <StatCard icon={<FaCircleCheck />} label="Terminados" value={completedTaskCount} accent="sky" />
                <StatCard
                  icon={<FiClock />}
                  label={isDeparted ? "Estancia" : "En hangar"}
                  value={stayDays != null ? `${stayDays} días` : "—"}
                  accent="royal"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h3 className={`mb-3 text-lg text-navy ${heading.className}`}>
                Datos generales
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              <section className="rounded-2xl border border-gold/40 bg-gold/10 p-4 shadow-sm sm:p-6">
                <h3 className={`mb-3 text-lg text-navy ${heading.className}`}>
                  Información de salida
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoField
                    label="Fecha de salida"
                    value={formatReportDateLong(aircraft.exitDate)}
                    className="!bg-white"
                  />
                  <InfoField
                    label="Registrado por"
                    value={aircraft.exitReportByName}
                    className="!bg-white"
                  />
                  <InfoField
                    label="Nota de salida"
                    value={aircraft.exitNote}
                    className="sm:col-span-2 !bg-white"
                  />
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h3 className={`mb-3 text-lg text-navy ${heading.className}`}>
                Condiciones de llegada
              </h3>
              {Array.isArray(aircraft.arrivalConditions) &&
              aircraft.arrivalConditions.length > 0 ? (
                <div className="space-y-2">
                  {aircraft.arrivalConditions.map((condition, index) => (
                    <div
                      key={condition._id || `condition-${index}`}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-mist/60 p-3"
                    >
                      <FaCircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-royal" />
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold text-navy ${roboto_condensed.className}`}
                        >
                          {condition.title}
                        </p>
                        <p
                          className={`text-sm text-slate-600 ${roboto_condensed.className}`}
                        >
                          {condition.description || "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
                  No hay condiciones registradas.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className={`text-lg text-navy ${heading.className}`}>
                  Pendientes de mantenimiento
                </h3>
                <button
                  type="button"
                  onClick={handleOpenPendingModal}
                  disabled={isDeparted}
                  className={`inline-flex items-center gap-2 rounded-xl bg-royal px-3 py-2 text-sm font-semibold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50 ${roboto_condensed.className}`}
                >
                  <FiPlus className="h-4 w-4" />
                  Agregar pendiente
                </button>
              </div>

              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
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
                    className={`w-full sm:max-w-xs ${inputCls}`}
                  >
                    {PENDING_TASK_TYPE_FILTER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <p className={`text-sm font-semibold text-slate-500 ${roboto_condensed.className}`}>
                  <span className="text-amber-700">{pendingTasks.length} activos</span> · {completedTasks.length} terminados
                </p>
              </div>

              {tableTasks.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-mist">
                      <tr>
                        <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-royal ${roboto_condensed.className}`}>Título</th>
                        <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-royal ${roboto_condensed.className}`}>Tipo</th>
                        <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-royal ${roboto_condensed.className}`}>Descripción</th>
                        <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-royal ${roboto_condensed.className}`}>Estado</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tableTasks.map((task, index) => renderTaskRow(task, index))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
                  No hay pendientes para el filtro seleccionado.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className={`text-lg text-navy ${heading.className}`}>
                  Bitácora de estancia
                </h3>
                <button
                  type="button"
                  onClick={handleOpenObservationModal}
                  disabled={isDeparted}
                  className={`inline-flex items-center gap-2 rounded-xl bg-royal px-3 py-2 text-sm font-semibold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50 ${roboto_condensed.className}`}
                >
                  <FiPlus className="h-4 w-4" />
                  Agregar observación
                </button>
              </div>

              {timelineObservations.length > 0 ? (
                <ol className="relative space-y-5 border-l-2 border-slate-200 pl-5">
                  {timelineObservations.map((observation, index) => (
                    <li key={observation._id || `observation-${index}`} className="relative">
                      <span className="absolute -left-[25px] top-0.5 h-3 w-3 rounded-full bg-royal ring-4 ring-white" />
                      {observation.createdAt && (
                        <p className={`text-xs text-slate-400 ${roboto_condensed.className}`}>
                          {formatReportDateTime(observation.createdAt)}
                        </p>
                      )}
                      <p
                        className={`text-sm font-semibold text-navy ${roboto_condensed.className}`}
                      >
                        {observation.title}
                      </p>
                      <p
                        className={`text-sm text-slate-600 ${roboto_condensed.className}`}
                      >
                        {observation.description || "—"}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
                  No hay observaciones registradas.
                </p>
              )}
            </section>

            {Array.isArray(aircraft.reports) && aircraft.reports.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <h3 className={`mb-3 text-lg text-navy ${heading.className}`}>
                  Reportes
                </h3>
                <div className="space-y-2">
                  {aircraft.reports.map((report, index) => (
                    <div
                      key={report._id || `report-${index}`}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-mist/60 p-3"
                    >
                      <FiFileText className="mt-0.5 h-4 w-4 shrink-0 text-royal" />
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold text-navy ${roboto_condensed.className}`}
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
                    </div>
                  ))}
                </div>
              </section>
            )}

            {isPendingModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                  <h3 className={`mb-4 text-lg text-navy ${heading.className}`}>
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
                      className={inputCls}
                    />
                    <select
                      value={pendingForm.taskType}
                      onChange={(event) =>
                        setPendingForm((prev) => ({
                          ...prev,
                          taskType: event.target.value,
                        }))
                      }
                      className={inputCls}
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
                      className={inputCls}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={isSubmittingPending}
                        className={btnPrimary}
                      >
                        {isSubmittingPending ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPendingModalOpen(false)}
                        disabled={isSubmittingPending}
                        className={btnGray}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isObservationModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                  <h3 className={`mb-4 text-lg text-navy ${heading.className}`}>
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
                      className={inputCls}
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
                      className={inputCls}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={isSubmittingObservation}
                        className={btnPrimary}
                      >
                        {isSubmittingObservation ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsObservationModalOpen(false)}
                        disabled={isSubmittingObservation}
                        className={btnGray}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {completeTask && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                  <h3 className={`mb-1 text-lg text-navy ${heading.className}`}>
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
                      className={inputCls}
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
                      className={inputCls}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={isSubmittingComplete}
                        className={`rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70 ${roboto_condensed.className}`}
                      >
                        {isSubmittingComplete
                          ? "Guardando..."
                          : "Marcar terminado"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompleteTask(null)}
                        disabled={isSubmittingComplete}
                        className={btnGray}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isExitModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                  <h3 className={`mb-1 text-lg text-navy ${heading.className}`}>
                    Registrar salida
                  </h3>
                  <p className={`mb-4 text-sm text-slate-500 ${roboto_condensed.className}`}>
                    {aircraft.registration}
                  </p>

                  {hasOpenPendings && (
                    <div className="mb-4 rounded-xl border border-gold bg-gold/10 p-3">
                      <p className={`text-sm font-bold text-amber-800 ${roboto_condensed.className}`}>
                        ¿Estás seguro de autorizar la salida? Hay {allPendingTasks.length} pendiente
                        {allPendingTasks.length === 1 ? "" : "s"} sin completar:
                      </p>
                      <ul className={`mt-2 list-disc space-y-0.5 pl-5 text-sm text-amber-900 ${roboto_condensed.className}`}>
                        {allPendingTasks.map((task) => (
                          <li key={getTaskId(task)}>{task.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}

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
                      className={inputCls}
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
                      className={inputCls}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={isSubmittingExit}
                        className={
                          hasOpenPendings
                            ? `rounded-xl bg-gradient-to-r from-gold to-amber-600 px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:brightness-105 disabled:opacity-70 ${roboto_condensed.className}`
                            : btnPrimary
                        }
                      >
                        {isSubmittingExit
                          ? "Registrando..."
                          : hasOpenPendings
                            ? "Sí, autorizar salida con pendientes"
                            : "Confirmar salida"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsExitModalOpen(false)}
                        disabled={isSubmittingExit}
                        className={btnGray}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isReportModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
                <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className={`text-lg text-navy ${heading.className}`}>
                      Vista previa del reporte
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isDownloadingPdf || !reportData}
                        className={btnPrimary}
                      >
                        {isDownloadingPdf ? "Descargando..." : "Descargar PDF"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsReportModalOpen(false)}
                        className={btnGray}
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
