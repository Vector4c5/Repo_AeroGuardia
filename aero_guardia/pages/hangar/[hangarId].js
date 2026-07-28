import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Roboto_Condensed } from "next/font/google";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { FaPlane, FaPlus } from "react-icons/fa6";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import { MdOutlinePendingActions } from "react-icons/md";

import Header from "@/Components/common/Header";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { PENDING_TASK_TYPES } from "@/lib/pendingTaskTypes";
import {
  REGISTRATION_PREFIX_OPTIONS,
  buildRegistration,
  normalizeRegistrationPart,
} from "@/lib/registration";
import { buildDisplayName } from "@/lib/userProfile";

const roboto_condensed = Roboto_Condensed({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const AIRCRAFT_TYPES = [
  "Ala fija",
  "Ala rotativa",
  "Vehículo no tripulado",
  "Otro",
];

const STAY_REASON_PRESETS = [
  "Mantenimiento",
  "Inspección",
  "Almacenamiento",
  "Reparación",
  "Modificación",
  "Pernocta",
  "Otro",
];

const STATUS_FILTERS = [
  { id: "all", label: "Todas" },
  { id: "En hangar", label: "En hangar" },
  { id: "Salida", label: "Salida" },
  { id: "pending", label: "Con pendientes" },
];

const EMPTY_ITEM_DRAFT = { title: "", description: "" };
const EMPTY_TASK_DRAFT = { title: "", description: "", taskType: PENDING_TASK_TYPES[0] };

const todayInputValue = () => new Date().toISOString().split("T")[0];

const EMPTY_AIRCRAFT_FORM = {
  registration: "",
  manufacturer: "",
  model: "",
  serialNumber: "",
  aircraftType: AIRCRAFT_TYPES[0],
  stayReasonPreset: STAY_REASON_PRESETS[0],
  stayReasonOther: "",
  entryDate: todayInputValue(),
  arrivalConditions: [],
  maintenanceTasks: [],
};

const getAircraftId = (aircraft) =>
  aircraft?._id?.toString?.() || aircraft?._id || aircraft?.id || "";

const hasPendingTasks = (aircraft) =>
  Array.isArray(aircraft?.maintenanceTasks) &&
  aircraft.maintenanceTasks.some((task) => task.status === "pending");

const formatDateLabel = (value) => {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const resolveStayReason = (form) => {
  if (form.stayReasonPreset === "Otro") {
    return form.stayReasonOther.trim();
  }

  return form.stayReasonPreset;
};

export default function HangarDetailPage() {
  const router = useRouter();
  const { hangarId } = router.query;
  const { data: session, status } = useSession();

  const [hangar, setHangar] = useState(null);
  const [aircraftList, setAircraftList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [isAircraftModalOpen, setIsAircraftModalOpen] = useState(false);
  const [intakeStep, setIntakeStep] = useState("lookup");
  const [regPrefix, setRegPrefix] = useState("XB-");
  const [regCustomPrefix, setRegCustomPrefix] = useState("");
  const [regSequence, setRegSequence] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [aircraftForm, setAircraftForm] = useState(EMPTY_AIRCRAFT_FORM);
  const [conditionDraft, setConditionDraft] = useState(EMPTY_ITEM_DRAFT);
  const [taskDraft, setTaskDraft] = useState(EMPTY_TASK_DRAFT);
  const [isSubmittingAircraft, setIsSubmittingAircraft] = useState(false);

  const [exitAircraft, setExitAircraft] = useState(null);
  const [exitForm, setExitForm] = useState({
    exitReportByName: "",
    exitNote: "",
  });
  const [isSubmittingExit, setIsSubmittingExit] = useState(false);

  const sessionDisplayName = useMemo(
    () =>
      buildDisplayName(session?.user?.firstNames, session?.user?.lastNames) ||
      session?.user?.name ||
      session?.user?.username ||
      "",
    [session]
  );

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status !== "authenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !hangarId || typeof hangarId !== "string") {
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

        const hangarPayload = await hangarResponse.json();
        const aircraftPayload = await aircraftResponse.json();

        if (!hangarResponse.ok) {
          throw new Error(
            hangarPayload.error || "No se pudo cargar la información del hangar."
          );
        }

        if (!aircraftResponse.ok) {
          throw new Error(
            aircraftPayload.error || "No se pudo cargar la lista de aeronaves."
          );
        }

        if (!isMounted) {
          return;
        }

        setHangar(hangarPayload.hangar || null);
        setAircraftList(
          Array.isArray(aircraftPayload.aircraftList)
            ? aircraftPayload.aircraftList
            : []
        );
      } catch (loadError) {
        if (isMounted) {
          const message =
            loadError.message || "No se pudo cargar la información del hangar.";
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
  }, [hangarId, status]);

  const filteredAircraft = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toUpperCase();

    return aircraftList.filter((aircraft) => {
      if (statusFilter === "En hangar" && aircraft.status !== "En hangar") {
        return false;
      }

      if (statusFilter === "Salida" && aircraft.status !== "Salida") {
        return false;
      }

      if (statusFilter === "pending" && !hasPendingTasks(aircraft)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return String(aircraft.registration || "")
        .toUpperCase()
        .includes(normalizedSearch);
    });
  }, [aircraftList, searchTerm, statusFilter]);

  const handleAircraftFormChange = (field, value) => {
    setAircraftForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCondition = () => {
    const nextCondition = {
      title: conditionDraft.title.trim(),
      description: conditionDraft.description.trim(),
    };

    if (!nextCondition.title) {
      notifyError("El título de la condición de llegada es obligatorio.");
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
      arrivalConditions: prev.arrivalConditions.filter(
        (_, index) => index !== indexToRemove
      ),
    }));
  };

  const handleAddTask = () => {
    const nextTask = {
      title: taskDraft.title.trim(),
      description: taskDraft.description.trim(),
      taskType: taskDraft.taskType || PENDING_TASK_TYPES[0],
    };

    if (!nextTask.title) {
      notifyError("El título del pendiente es obligatorio.");
      return;
    }

    setAircraftForm((prev) => ({
      ...prev,
      maintenanceTasks: [...prev.maintenanceTasks, nextTask],
    }));
    setTaskDraft(EMPTY_TASK_DRAFT);
  };

  const handleRemoveTask = (indexToRemove) => {
    setAircraftForm((prev) => ({
      ...prev,
      maintenanceTasks: prev.maintenanceTasks.filter(
        (_, index) => index !== indexToRemove
      ),
    }));
  };

  const composedRegistration = useMemo(
    () => buildRegistration(regPrefix, regSequence, regCustomPrefix),
    [regPrefix, regSequence, regCustomPrefix]
  );

  const handleOpenCreateAircraft = () => {
    setIntakeStep("lookup");
    setRegPrefix("XB-");
    setRegCustomPrefix("");
    setRegSequence("");
    setLookupResult(null);
    setAircraftForm({
      ...EMPTY_AIRCRAFT_FORM,
      entryDate: todayInputValue(),
    });
    setConditionDraft(EMPTY_ITEM_DRAFT);
    setTaskDraft(EMPTY_TASK_DRAFT);
    setIsAircraftModalOpen(true);
  };

  const handleCloseAircraftModal = () => {
    if (isSubmittingAircraft || isLookingUp) {
      return;
    }

    setIsAircraftModalOpen(false);
    setIntakeStep("lookup");
    setLookupResult(null);
  };

  const handleBackToLookup = () => {
    if (isSubmittingAircraft || isLookingUp) {
      return;
    }

    setIntakeStep("lookup");
    setLookupResult(null);
    setAircraftForm({
      ...EMPTY_AIRCRAFT_FORM,
      entryDate: todayInputValue(),
    });
    setConditionDraft(EMPTY_ITEM_DRAFT);
    setTaskDraft(EMPTY_TASK_DRAFT);
  };

  const handleLookupRegistration = async (event) => {
    event.preventDefault();

    const registration = composedRegistration;

    if (!registration) {
      notifyError("Completa el prefijo y la secuencia de la matrícula.");
      return;
    }

    setIsLookingUp(true);

    try {
      const response = await fetch(
        `/api/hangars/${hangarId}/aircraft/lookup?registration=${encodeURIComponent(registration)}`
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo buscar la matrícula.");
      }

      setLookupResult(payload);

      if (payload.canCreate) {
        setAircraftForm({
          ...EMPTY_AIRCRAFT_FORM,
          registration: payload.registration,
          entryDate: todayInputValue(),
        });
        setIntakeStep("create");
        notifySuccess("Matrícula nueva. Completa el archivo de ingreso.");
        return;
      }

      if (payload.canReenter && payload.aircraft) {
        const previous = payload.aircraft;
        const matchedPreset = STAY_REASON_PRESETS.includes(previous.stayReason)
          ? previous.stayReason
          : "Otro";

        setAircraftForm({
          ...EMPTY_AIRCRAFT_FORM,
          registration: previous.registration,
          manufacturer: previous.manufacturer || "",
          model: previous.model || "",
          serialNumber: previous.serialNumber || "",
          aircraftType: previous.aircraftType || AIRCRAFT_TYPES[0],
          stayReasonPreset: matchedPreset,
          stayReasonOther:
            matchedPreset === "Otro" ? previous.stayReason || "" : "",
          entryDate: todayInputValue(),
          arrivalConditions: [],
          maintenanceTasks: [],
        });
        setIntakeStep("reentry");
        notifySuccess(
          payload.message || "Aeronave encontrada. Datos autorrellenados."
        );
        return;
      }

      if (payload.canClaim) {
        setAircraftForm({
          ...EMPTY_AIRCRAFT_FORM,
          registration: payload.registration,
          entryDate: todayInputValue(),
        });
        setIntakeStep("claim");
        notifySuccess(
          "Matrícula registrada en otro hangar. Completa los datos manualmente."
        );
        return;
      }

      setIntakeStep("blocked");
      notifyError(payload.message || "No se puede ingresar esta matrícula.");
    } catch (lookupError) {
      notifyError(lookupError.message || "Error al buscar la matrícula.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmitAircraft = async (event) => {
    event.preventDefault();

    const stayReason = resolveStayReason(aircraftForm);
    const registration = normalizeRegistrationPart(
      aircraftForm.registration || composedRegistration
    );

    if (intakeStep === "reentry") {
      if (!lookupResult?.aircraft?._id) {
        notifyError("No hay aeronave de referencia para reingresar.");
        return;
      }

      if (!stayReason || !aircraftForm.entryDate) {
        notifyError("Completa razón de estancia y fecha de ingreso.");
        return;
      }

      setIsSubmittingAircraft(true);

      try {
        const response = await fetch(`/api/hangars/${hangarId}/aircraft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "reentry",
            aircraftId: lookupResult.aircraft._id,
            intakeReportByName: sessionDisplayName,
            stayReason,
            entryDate: aircraftForm.entryDate,
            arrivalConditions: aircraftForm.arrivalConditions,
            maintenanceTasks: aircraftForm.maintenanceTasks,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "No se pudo reingresar la aeronave.");
        }

        if (payload.aircraft) {
          const reenteredId =
            payload.aircraft._id?.toString?.() || payload.aircraft._id;
          setAircraftList((prev) => {
            const without = prev.filter(
              (item) => getAircraftId(item) !== String(reenteredId)
            );
            return [payload.aircraft, ...without];
          });
        }

        notifySuccess("Aeronave reingresada correctamente.");
        setIsAircraftModalOpen(false);
        setIntakeStep("lookup");
        setLookupResult(null);
      } catch (submitError) {
        notifyError(submitError.message || "No se pudo reingresar la aeronave.");
      } finally {
        setIsSubmittingAircraft(false);
      }

      return;
    }

    if (intakeStep === "claim") {
      const manufacturer = aircraftForm.manufacturer.trim();
      const model = aircraftForm.model.trim();
      const serialNumber = aircraftForm.serialNumber.trim();

      if (
        !registration ||
        !manufacturer ||
        !model ||
        !serialNumber ||
        !aircraftForm.aircraftType ||
        !stayReason ||
        !aircraftForm.entryDate
      ) {
        notifyError("Completa todos los campos obligatorios del ingreso.");
        return;
      }

      setIsSubmittingAircraft(true);

      try {
        const response = await fetch(`/api/hangars/${hangarId}/aircraft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "claim",
            intakeReportByName: sessionDisplayName,
            registration,
            manufacturer,
            model,
            serialNumber,
            aircraftType: aircraftForm.aircraftType,
            stayReason,
            entryDate: aircraftForm.entryDate,
            arrivalConditions: aircraftForm.arrivalConditions,
            maintenanceTasks: aircraftForm.maintenanceTasks,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "No se pudo ingresar la aeronave.");
        }

        if (payload.aircraft) {
          const claimedId =
            payload.aircraft._id?.toString?.() || payload.aircraft._id;
          setAircraftList((prev) => {
            const without = prev.filter(
              (item) => getAircraftId(item) !== String(claimedId)
            );
            return [payload.aircraft, ...without];
          });
        }

        notifySuccess("Aeronave ingresada correctamente.");
        setIsAircraftModalOpen(false);
        setIntakeStep("lookup");
        setLookupResult(null);
      } catch (submitError) {
        notifyError(submitError.message || "No se pudo ingresar la aeronave.");
      } finally {
        setIsSubmittingAircraft(false);
      }

      return;
    }

    const manufacturer = aircraftForm.manufacturer.trim();
    const model = aircraftForm.model.trim();
    const serialNumber = aircraftForm.serialNumber.trim();

    if (
      !registration ||
      !manufacturer ||
      !model ||
      !serialNumber ||
      !aircraftForm.aircraftType ||
      !stayReason ||
      !aircraftForm.entryDate
    ) {
      notifyError("Completa todos los campos obligatorios del ingreso.");
      return;
    }

    setIsSubmittingAircraft(true);

    try {
      const response = await fetch(`/api/hangars/${hangarId}/aircraft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "create",
          intakeReportByName: sessionDisplayName,
          registration,
          manufacturer,
          model,
          serialNumber,
          aircraftType: aircraftForm.aircraftType,
          stayReason,
          entryDate: aircraftForm.entryDate,
          arrivalConditions: aircraftForm.arrivalConditions,
          maintenanceTasks: aircraftForm.maintenanceTasks,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo crear la aeronave.");
      }

      if (payload.aircraft) {
        setAircraftList((prev) => [payload.aircraft, ...prev]);
      }

      notifySuccess("Aeronave registrada correctamente.");
      setIsAircraftModalOpen(false);
      setIntakeStep("lookup");
      setLookupResult(null);
    } catch (submitError) {
      notifyError(submitError.message || "No se pudo guardar la aeronave.");
    } finally {
      setIsSubmittingAircraft(false);
    }
  };

  const handleOpenExitModal = (aircraft) => {
    const pendingCount = Array.isArray(aircraft?.maintenanceTasks)
      ? aircraft.maintenanceTasks.filter((task) => task.status === "pending")
          .length
      : 0;

    if (pendingCount > 0) {
      notifyError(
        `No se puede registrar la salida: hay ${pendingCount} pendiente${pendingCount === 1 ? "" : "s"} sin completar.`
      );
      return;
    }

    setExitAircraft(aircraft);
    setExitForm({
      exitReportByName: sessionDisplayName,
      exitNote: "",
    });
  };

  const handleCloseExitModal = () => {
    if (isSubmittingExit) {
      return;
    }

    setExitAircraft(null);
    setExitForm({ exitReportByName: "", exitNote: "" });
  };

  const handleSubmitExit = async (event) => {
    event.preventDefault();

    if (!exitAircraft) {
      return;
    }

    const pendingCount = Array.isArray(exitAircraft.maintenanceTasks)
      ? exitAircraft.maintenanceTasks.filter((task) => task.status === "pending")
          .length
      : 0;

    if (pendingCount > 0) {
      notifyError(
        `No se puede registrar la salida: hay ${pendingCount} pendiente${pendingCount === 1 ? "" : "s"} sin completar.`
      );
      return;
    }

    const exitReportByName = exitForm.exitReportByName.trim();
    const exitNote = exitForm.exitNote.trim();

    if (!exitReportByName || !exitNote) {
      notifyError("Completa el nombre y la descripción de la salida.");
      return;
    }

    const aircraftId = getAircraftId(exitAircraft);

    setIsSubmittingExit(true);

    try {
      const response = await fetch(
        `/api/hangars/${hangarId}/aircraft/${aircraftId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "register_exit",
            exitReportByName,
            exitNote,
          }),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo registrar la salida.");
      }

      if (payload.aircraft) {
        setAircraftList((prev) =>
          prev.map((item) =>
            getAircraftId(item) === aircraftId ? payload.aircraft : item
          )
        );
      }

      notifySuccess("Salida registrada correctamente.");
      handleCloseExitModal();
    } catch (exitError) {
      notifyError(exitError.message || "No se pudo registrar la salida.");
    } finally {
      setIsSubmittingExit(false);
    }
  };

  const handleDeleteAircraft = async (aircraft) => {
    const aircraftId = getAircraftId(aircraft);
    const registration = aircraft.registration || "esta aeronave";

    const confirmed = window.confirm(
      `¿Eliminar la aeronave ${registration}? Esta acción no se puede deshacer.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/hangars/${hangarId}/aircraft/${aircraftId}`,
        { method: "DELETE" }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo borrar la aeronave.");
      }

      setAircraftList((prev) =>
        prev.filter((item) => getAircraftId(item) !== aircraftId)
      );
      notifySuccess("Aeronave eliminada correctamente.");
    } catch (deleteError) {
      notifyError(deleteError.message || "No se pudo borrar la aeronave.");
    }
  };

  if (status === "loading" || status !== "authenticated") {
    return (
      <div className="min-h-screen bg-slate-100 px-3 pt-24 pb-8 text-slate-900 sm:px-6 sm:pt-28 md:px-10 md:pt-32">
        <div className="fixed left-0 top-0 z-50 w-screen">
          <Header />
        </div>
        <main className="mx-auto w-full max-w-5xl">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className={`text-slate-600 ${roboto_condensed.className}`}>
              {status === "loading"
                ? "Verificando sesión..."
                : "Redirigiendo al inicio de sesión..."}
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-3 pt-24 pb-8 text-slate-900 sm:px-6 sm:pt-28 md:px-10 md:pt-32">
      <div className="fixed left-0 top-0 z-50 w-screen">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-5xl space-y-6">
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
              href="/inicio"
              className={`mt-3 inline-flex rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
            >
              Volver al inicio
            </Link>
          </section>
        )}

        {!isLoading && !error && hangar && (
          <>
            <div className="relative">
              <Link
                href="/inicio"
                aria-label="Volver al inicio"
                className="absolute left-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 sm:h-12 sm:w-12 md:-left-16 md:top-6 md:h-13 md:w-13 lg:-left-20"
              >
                <FiArrowLeft size={30} className="text-black" />
              </Link>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {hangar.image ? (
                  <div className="relative w-full aspect-[4/3] sm:aspect-[16/9]">
                    <Image
                      src={hangar.image}
                      alt={`Vista de ${hangar.label || hangar.name}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 1200px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-slate-950/80 via-slate-950/35 to-slate-950/80" />
                    <div className="absolute left-3 top-14 z-10 max-w-3xl space-y-1 text-left text-white sm:left-6 sm:top-24 sm:space-y-2">
                      {hangar.zoneTitle && (
                        <p
                          className={`text-sm font-semibold uppercase tracking-[0.2em] text-slate-200 sm:text-xl sm:tracking-[0.32em] ${roboto_condensed.className}`}
                        >
                          {hangar.zoneTitle}
                        </p>
                      )}
                      <h2
                        className={`text-3xl font-bold leading-none sm:text-6xl ${roboto_condensed.className}`}
                      >
                        {hangar.label || hangar.name}
                      </h2>
                      <p
                        className={`text-sm text-slate-100 sm:text-lg ${roboto_condensed.className}`}
                      >
                        {hangar.location || "Sin ubicación"}
                      </p>
                    </div>
                    {hangar.description && (
                      <div className="absolute bottom-3 left-3 right-3 z-10 max-w-2xl rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-white backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-auto sm:px-4 sm:py-3">
                        <p
                          className={`text-sm leading-relaxed text-slate-100 sm:text-xl ${roboto_condensed.className}`}
                        >
                          {hangar.description}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 p-5 sm:p-6">
                    {hangar.zoneTitle && (
                      <p
                        className={`text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 ${roboto_condensed.className}`}
                      >
                        {hangar.zoneTitle}
                      </p>
                    )}
                    <h2
                      className={`text-3xl font-bold text-slate-900 ${roboto_condensed.className}`}
                    >
                      {hangar.label || hangar.name}
                    </h2>
                    <p className={`text-sm text-slate-600 ${roboto_condensed.className}`}>
                      {hangar.location || "Sin ubicación"}
                    </p>
                    {hangar.description && (
                      <p className={`text-sm text-slate-600 ${roboto_condensed.className}`}>
                        {hangar.description}
                      </p>
                    )}
                  </div>
                )}
              </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3
                  className={`text-xl font-bold text-slate-800 ${roboto_condensed.className}`}
                >
                  Aeronaves del hangar
                </h3>
                <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
                  {filteredAircraft.length} de {aircraftList.length}
                </p>
              </div>

              <div className="mb-4 flex flex-col gap-3">
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar por matrícula"
                    className={`w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((filter) => {
                    const isActive = statusFilter === filter.id;

                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setStatusFilter(filter.id)}
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                          isActive
                            ? "bg-cyan-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        } ${roboto_condensed.className}`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAircraft.map((aircraft) => {
                  const aircraftId = getAircraftId(aircraft);
                  const pendingCount = Array.isArray(aircraft.maintenanceTasks)
                    ? aircraft.maintenanceTasks.filter(
                        (task) => task.status === "pending"
                      ).length
                    : 0;
                  const isDeparted = aircraft.status === "Salida";
                  const canExit = !isDeparted && pendingCount === 0;

                  return (
                    <article
                      key={aircraftId}
                      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-xl ${
                        isDeparted
                          ? "border-slate-200 opacity-90"
                          : pendingCount > 0
                            ? "border-amber-300"
                            : "border-cyan-200"
                      }`}
                    >
                      <div
                        className={`relative flex items-center gap-3 px-4 py-4 ${
                          isDeparted
                            ? "bg-slate-700"
                            : pendingCount > 0
                              ? "bg-gradient-to-r from-amber-500 to-orange-500"
                              : "bg-gradient-to-r from-cyan-600 to-blue-700"
                        }`}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
                          <FaPlane className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-xl font-bold tracking-wide text-white ${roboto_condensed.className}`}
                          >
                            {aircraft.registration || "N/A"}
                          </p>
                          <p
                            className={`truncate text-sm text-white/85 ${roboto_condensed.className}`}
                          >
                            {[aircraft.manufacturer, aircraft.model]
                              .filter(Boolean)
                              .join(" · ") || "Sin modelo"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                            isDeparted
                              ? "bg-white/20 text-white"
                              : "bg-white text-slate-800"
                          } ${roboto_condensed.className}`}
                        >
                          {aircraft.status || "En hangar"}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-slate-50 px-3 py-2">
                            <p
                              className={`text-[10px] font-semibold uppercase tracking-wide text-slate-400 ${roboto_condensed.className}`}
                            >
                              Tipo
                            </p>
                            <p
                              className={`truncate text-sm font-semibold text-slate-800 ${roboto_condensed.className}`}
                            >
                              {aircraft.aircraftType || "—"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-3 py-2">
                            <p
                              className={`text-[10px] font-semibold uppercase tracking-wide text-slate-400 ${roboto_condensed.className}`}
                            >
                              Ingreso
                            </p>
                            <p
                              className={`truncate text-sm font-semibold text-slate-800 ${roboto_condensed.className}`}
                            >
                              {formatDateLabel(aircraft.entryDate)}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p
                            className={`text-[10px] font-semibold uppercase tracking-wide text-slate-400 ${roboto_condensed.className}`}
                          >
                            Motivo de estancia
                          </p>
                          <p
                            className={`text-sm font-semibold text-slate-800 ${roboto_condensed.className}`}
                          >
                            {aircraft.stayReason || "—"}
                          </p>
                        </div>

                        {pendingCount > 0 ? (
                          <div
                            className={`flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 ${roboto_condensed.className}`}
                          >
                            <MdOutlinePendingActions className="h-5 w-5 shrink-0" />
                            {pendingCount} pendiente
                            {pendingCount === 1 ? "" : "s"} — sin salida hasta
                            completarlos
                          </div>
                        ) : !isDeparted ? (
                          <div
                            className={`rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 ${roboto_condensed.className}`}
                          >
                            Lista para salida
                          </div>
                        ) : null}

                        <div className="mt-auto grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                          <Link
                            href={`/hangar/${hangarId}/aeronave/${aircraftId}`}
                            className={`flex w-full items-center justify-center rounded-xl bg-cyan-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-cyan-700 ${roboto_condensed.className}`}
                          >
                            Ver detalle
                          </Link>
                          {isDeparted ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteAircraft(aircraft)}
                              className={`flex w-full items-center justify-center rounded-xl bg-red-100 px-3 py-3 text-sm font-bold text-red-700 transition hover:bg-red-200 ${roboto_condensed.className}`}
                            >
                              Borrar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenExitModal(aircraft)}
                              disabled={!canExit}
                              title={
                                canExit
                                  ? "Registrar salida"
                                  : "Completa los pendientes antes de registrar la salida"
                              }
                              className={`flex w-full items-center justify-center rounded-xl px-3 py-3 text-sm font-bold transition ${
                                canExit
                                  ? "bg-slate-800 text-white hover:bg-slate-900"
                                  : "cursor-not-allowed bg-slate-200 text-slate-400"
                              } ${roboto_condensed.className}`}
                            >
                              Salida
                            </button>
                          )}
                        </div>

                        {!isDeparted && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAircraft(aircraft)}
                            className={`w-full rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 ${roboto_condensed.className}`}
                          >
                            Eliminar aeronave
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {filteredAircraft.length === 0 && (
                <p className={`mt-4 text-sm text-slate-500 ${roboto_condensed.className}`}>
                  {aircraftList.length === 0
                    ? "No hay aeronaves registradas en este hangar."
                    : "No hay aeronaves que coincidan con el filtro o la búsqueda."}
                </p>
              )}
            </section>

            <button
              type="button"
              onClick={handleOpenCreateAircraft}
              aria-label="Agregar aeronave"
              title="Agregar aeronave"
              className={`group fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-600 text-2xl font-bold text-white shadow-lg shadow-cyan-500/40 transition hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 sm:bottom-6 sm:h-16 sm:w-16 sm:text-3xl md:right-15 md:h-20 md:w-20 ${roboto_condensed.className}`}
            >
              <span aria-hidden="true">
                <FaPlus size={28} className="text-white sm:h-8 sm:w-8 md:h-10 md:w-10" />
              </span>
              <span
                className={`pointer-events-none absolute -translate-y-16 whitespace-nowrap rounded-md bg-cyan-900 px-2 py-1 text-xs font-semibold text-white opacity-0 shadow transition sm:-translate-y-20 sm:px-3 sm:text-lg group-hover:opacity-100 ${roboto_condensed.className}`}
              >
                Agregar aeronave
              </span>
            </button>

            {isAircraftModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                  <h3
                    className={`mb-1 text-lg font-bold text-slate-900 ${roboto_condensed.className}`}
                  >
                    {intakeStep === "lookup" && "Ingresar aeronave"}
                    {intakeStep === "create" && "Nueva aeronave"}
                    {intakeStep === "reentry" && "Reingresar aeronave"}
                    {intakeStep === "claim" && "Ingreso manual"}
                    {intakeStep === "blocked" && "Matrícula no disponible"}
                  </h3>
                  <p
                    className={`mb-4 text-sm text-slate-500 ${roboto_condensed.className}`}
                  >
                    Reporte de ingreso: {sessionDisplayName || "Usuario"}
                  </p>

                  {intakeStep === "lookup" && (
                    <form
                      onSubmit={handleLookupRegistration}
                      className="grid grid-cols-1 gap-3"
                    >
                      <p
                        className={`text-sm text-slate-600 ${roboto_condensed.className}`}
                      >
                        Primero indica la matrícula. Si ya está en tus hangares,
                        se autorrellenan los datos. Si está en otro hangar de
                        AeroGuardia, podrás ingresarla completando los datos a
                        mano (la matrícula sigue siendo única).
                      </p>

                      <label
                        className={`text-sm font-semibold text-slate-700 ${roboto_condensed.className}`}
                      >
                        Prefijo (país / tipo)
                      </label>
                      <select
                        value={regPrefix}
                        onChange={(event) => setRegPrefix(event.target.value)}
                        className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                      >
                        {REGISTRATION_PREFIX_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {regPrefix === "CUSTOM" && (
                        <input
                          value={regCustomPrefix}
                          onChange={(event) =>
                            setRegCustomPrefix(
                              normalizeRegistrationPart(event.target.value)
                            )
                          }
                          placeholder="Prefijo personalizado (ej. XB-)"
                          className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                        />
                      )}

                      <label
                        className={`text-sm font-semibold text-slate-700 ${roboto_condensed.className}`}
                      >
                        Secuencia (letras / números)
                      </label>
                      <input
                        value={regSequence}
                        onChange={(event) =>
                          setRegSequence(
                            normalizeRegistrationPart(event.target.value)
                          )
                        }
                        placeholder="Ej. ABC o 123AB"
                        className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                      />

                      <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
                        <p
                          className={`text-xs font-semibold uppercase tracking-wide text-cyan-700 ${roboto_condensed.className}`}
                        >
                          Matrícula completa
                        </p>
                        <p
                          className={`mt-1 text-2xl font-bold tracking-wider text-cyan-950 ${roboto_condensed.className}`}
                        >
                          {composedRegistration || "—"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="submit"
                          disabled={isLookingUp || !composedRegistration}
                          className={`inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70 ${roboto_condensed.className}`}
                        >
                          <FiSearch className="h-4 w-4" />
                          {isLookingUp ? "Buscando..." : "Buscar matrícula"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseAircraftModal}
                          disabled={isLookingUp}
                          className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 disabled:opacity-70 ${roboto_condensed.className}`}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}

                  {intakeStep === "blocked" && (
                    <div className="space-y-4">
                      <div
                        className={`rounded-xl border px-4 py-3 ${
                          lookupResult?.reason === "private_other_hangar"
                            ? "border-slate-200 bg-slate-50"
                            : "border-amber-200 bg-amber-50"
                        }`}
                      >
                        {lookupResult?.reason !== "private_other_hangar" && (
                          <p
                            className={`text-lg font-bold text-amber-950 ${roboto_condensed.className}`}
                          >
                            {lookupResult?.registration || composedRegistration}
                          </p>
                        )}
                        <p
                          className={`text-sm ${
                            lookupResult?.reason === "private_other_hangar"
                              ? "text-slate-700"
                              : "mt-1 text-amber-800"
                          } ${roboto_condensed.className}`}
                        >
                          {lookupResult?.message ||
                            "No se puede ingresar esta matrícula."}
                        </p>
                        {lookupResult?.reason === "private_other_hangar" && (
                          <p
                            className={`mt-2 text-xs text-slate-500 ${roboto_condensed.className}`}
                          >
                            Por privacidad no se muestra el historial ni los
                            datos del registro de otros hangares.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={handleBackToLookup}
                          className={`rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 ${roboto_condensed.className}`}
                        >
                          Buscar otra matrícula
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseAircraftModal}
                          className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  )}

                  {(intakeStep === "create" ||
                    intakeStep === "reentry" ||
                    intakeStep === "claim") && (
                    <form
                      onSubmit={handleSubmitAircraft}
                      className="grid grid-cols-1 gap-3"
                    >
                      <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
                        <p
                          className={`text-xs font-semibold uppercase tracking-wide text-cyan-700 ${roboto_condensed.className}`}
                        >
                          Matrícula
                        </p>
                        <p
                          className={`mt-1 text-2xl font-bold tracking-wider text-cyan-950 ${roboto_condensed.className}`}
                        >
                          {aircraftForm.registration || composedRegistration}
                        </p>
                        {intakeStep === "reentry" && (
                          <p
                            className={`mt-2 text-sm text-cyan-800 ${roboto_condensed.className}`}
                          >
                            Reingreso desde tus hangares: se autorrellenaron
                            fabricante, modelo, serie y tipo. Agrega los
                            pendientes de esta estancia.
                          </p>
                        )}
                        {intakeStep === "claim" && (
                          <p
                            className={`mt-2 text-sm text-slate-700 ${roboto_condensed.className}`}
                          >
                            Esta matrícula ya existe en AeroGuardia en otro
                            hangar. Por privacidad no se muestran sus datos:
                            completa el ingreso manualmente. La matrícula
                            permanece única.
                          </p>
                        )}
                      </div>

                      {intakeStep === "reentry" && lookupResult?.aircraft && (
                        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div>
                            <p
                              className={`text-[10px] font-semibold uppercase text-slate-400 ${roboto_condensed.className}`}
                            >
                              Fabricante
                            </p>
                            <p
                              className={`text-sm font-semibold text-slate-800 ${roboto_condensed.className}`}
                            >
                              {lookupResult.aircraft.manufacturer}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-[10px] font-semibold uppercase text-slate-400 ${roboto_condensed.className}`}
                            >
                              Modelo
                            </p>
                            <p
                              className={`text-sm font-semibold text-slate-800 ${roboto_condensed.className}`}
                            >
                              {lookupResult.aircraft.model}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-[10px] font-semibold uppercase text-slate-400 ${roboto_condensed.className}`}
                            >
                              N° serie
                            </p>
                            <p
                              className={`text-sm font-semibold text-slate-800 ${roboto_condensed.className}`}
                            >
                              {lookupResult.aircraft.serialNumber}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-[10px] font-semibold uppercase text-slate-400 ${roboto_condensed.className}`}
                            >
                              Tipo
                            </p>
                            <p
                              className={`text-sm font-semibold text-slate-800 ${roboto_condensed.className}`}
                            >
                              {lookupResult.aircraft.aircraftType}
                            </p>
                          </div>
                        </div>
                      )}

                      {(intakeStep === "create" || intakeStep === "claim") && (
                        <>
                          <input
                            value={aircraftForm.manufacturer}
                            onChange={(event) =>
                              handleAircraftFormChange(
                                "manufacturer",
                                event.target.value
                              )
                            }
                            placeholder="Fabricante (Ej. Cessna)"
                            className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                          />
                          <input
                            value={aircraftForm.model}
                            onChange={(event) =>
                              handleAircraftFormChange("model", event.target.value)
                            }
                            placeholder="Modelo (Ej. 206)"
                            className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                          />
                          <input
                            value={aircraftForm.serialNumber}
                            onChange={(event) =>
                              handleAircraftFormChange(
                                "serialNumber",
                                event.target.value
                              )
                            }
                            placeholder="Número de serie"
                            className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                          />

                          <label
                            className={`text-sm font-semibold text-slate-700 ${roboto_condensed.className}`}
                          >
                            Tipo de aeronave
                          </label>
                          <select
                            value={aircraftForm.aircraftType}
                            onChange={(event) =>
                              handleAircraftFormChange(
                                "aircraftType",
                                event.target.value
                              )
                            }
                            className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                          >
                            {AIRCRAFT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </>
                      )}

                      <label
                        className={`text-sm font-semibold text-slate-700 ${roboto_condensed.className}`}
                      >
                        Razón de estancia
                      </label>
                      <select
                        value={aircraftForm.stayReasonPreset}
                        onChange={(event) =>
                          handleAircraftFormChange(
                            "stayReasonPreset",
                            event.target.value
                          )
                        }
                        className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                      >
                        {STAY_REASON_PRESETS.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>

                      {aircraftForm.stayReasonPreset === "Otro" && (
                        <input
                          value={aircraftForm.stayReasonOther}
                          onChange={(event) =>
                            handleAircraftFormChange(
                              "stayReasonOther",
                              event.target.value
                            )
                          }
                          placeholder="Describe la razón de estancia"
                          className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                        />
                      )}

                      <label
                        className={`text-sm font-semibold text-slate-700 ${roboto_condensed.className}`}
                      >
                        Fecha de ingreso
                      </label>
                      <input
                        type="date"
                        value={aircraftForm.entryDate}
                        onChange={(event) =>
                          handleAircraftFormChange(
                            "entryDate",
                            event.target.value
                          )
                        }
                        className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                      />

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p
                          className={`mb-2 text-sm font-semibold text-slate-800 ${roboto_condensed.className}`}
                        >
                          Condiciones de llegada
                        </p>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          <input
                            value={conditionDraft.title}
                            onChange={(event) =>
                              setConditionDraft((prev) => ({
                                ...prev,
                                title: event.target.value,
                              }))
                            }
                            placeholder="Condición"
                            className={`rounded-md border border-slate-300 px-2 py-1 text-xs outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                          />
                          <input
                            value={conditionDraft.description}
                            onChange={(event) =>
                              setConditionDraft((prev) => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                            placeholder="Descripción"
                            className={`rounded-md border border-slate-300 px-2 py-1 text-xs outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                          />
                          <button
                            type="button"
                            onClick={handleAddCondition}
                            className={`rounded-md bg-slate-700 px-2 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 ${roboto_condensed.className}`}
                          >
                            Agregar
                          </button>
                        </div>

                        <div className="mt-2 space-y-1">
                          {aircraftForm.arrivalConditions.map(
                            (condition, index) => (
                              <div
                                key={`condition-${index}`}
                                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2 py-1"
                              >
                                <p
                                  className={`text-xs text-slate-700 ${roboto_condensed.className}`}
                                >
                                  {condition.title}:{" "}
                                  {condition.description || "—"}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCondition(index)}
                                  className={`rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-200 ${roboto_condensed.className}`}
                                >
                                  Quitar
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                        <p
                          className={`mb-2 text-sm font-semibold text-cyan-900 ${roboto_condensed.className}`}
                        >
                          {intakeStep === "reentry" || intakeStep === "claim"
                            ? "Pendientes de este ingreso"
                            : "Pendientes de mantenimiento (opcional)"}
                        </p>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <input
                            value={taskDraft.title}
                            onChange={(event) =>
                              setTaskDraft((prev) => ({
                                ...prev,
                                title: event.target.value,
                              }))
                            }
                            placeholder="Título del pendiente"
                            className={`rounded-md border border-cyan-300 px-2 py-1 text-xs outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                          />
                          <select
                            value={taskDraft.taskType}
                            onChange={(event) =>
                              setTaskDraft((prev) => ({
                                ...prev,
                                taskType: event.target.value,
                              }))
                            }
                            className={`rounded-md border border-cyan-300 px-2 py-1 text-xs outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                          >
                            {PENDING_TASK_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <input
                            value={taskDraft.description}
                            onChange={(event) =>
                              setTaskDraft((prev) => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                            placeholder="Descripción"
                            className={`rounded-md border border-cyan-300 px-2 py-1 text-xs outline-none ring-cyan-300 focus:ring-2 md:col-span-2 ${roboto_condensed.className}`}
                          />
                          <button
                            type="button"
                            onClick={handleAddTask}
                            className={`rounded-md bg-cyan-700 px-2 py-1 text-xs font-semibold text-white transition hover:bg-cyan-800 md:col-span-2 ${roboto_condensed.className}`}
                          >
                            Agregar pendiente
                          </button>
                        </div>

                        <div className="mt-2 space-y-1">
                          {aircraftForm.maintenanceTasks.map((task, index) => (
                            <div
                              key={`task-${index}`}
                              className="flex items-center justify-between rounded-md border border-cyan-200 bg-white px-2 py-1"
                            >
                              <p
                                className={`text-xs text-cyan-900 ${roboto_condensed.className}`}
                              >
                                [{task.taskType}] {task.title}
                                {task.description ? `: ${task.description}` : ""}
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

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="submit"
                          disabled={isSubmittingAircraft}
                          className={`rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70 ${roboto_condensed.className}`}
                        >
                          {isSubmittingAircraft
                            ? "Guardando..."
                            : intakeStep === "reentry"
                              ? "Confirmar reingreso"
                              : intakeStep === "claim"
                                ? "Confirmar ingreso"
                                : "Guardar aeronave"}
                        </button>
                        <button
                          type="button"
                          onClick={handleBackToLookup}
                          disabled={isSubmittingAircraft}
                          className={`rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-70 ${roboto_condensed.className}`}
                        >
                          Cambiar matrícula
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseAircraftModal}
                          disabled={isSubmittingAircraft}
                          className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 disabled:opacity-70 ${roboto_condensed.className}`}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {exitAircraft && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                  <h3
                    className={`mb-1 text-lg font-bold text-slate-900 ${roboto_condensed.className}`}
                  >
                    Registrar salida
                  </h3>
                  <p className={`mb-4 text-sm text-slate-500 ${roboto_condensed.className}`}>
                    {exitAircraft.registration}
                  </p>

                  <form onSubmit={handleSubmitExit} className="grid grid-cols-1 gap-3">
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
                        className={`rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70 ${roboto_condensed.className}`}
                      >
                        {isSubmittingExit ? "Registrando..." : "Confirmar salida"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseExitModal}
                        disabled={isSubmittingExit}
                        className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 disabled:opacity-70 ${roboto_condensed.className}`}
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
