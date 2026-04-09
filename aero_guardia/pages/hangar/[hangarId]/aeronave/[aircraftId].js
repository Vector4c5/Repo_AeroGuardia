import Link from "next/link";
import { useRouter } from "next/router";
import { Roboto_Condensed } from "next/font/google";
import { useEffect, useState } from "react";
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

export default function AircraftDetailPage() {
  const router = useRouter();
  const { hangarId, aircraftId } = router.query;

  const [hangar, setHangar] = useState(null);
  const [aircraft, setAircraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-28 text-slate-900 sm:px-8 md:px-12">
      <div className="fixed left-0 top-0 z-50 w-screen">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className={`text-2xl font-bold text-slate-900 ${roboto_condensed.className}`}>Detalle de aeronave</h1>
          <Link
            href={`/hangar/${hangarId}`}
            className={`rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 ${roboto_condensed.className}`}
          >
            Volver al hangar
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

        {!isLoading && !error && aircraft && (
          <>
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
