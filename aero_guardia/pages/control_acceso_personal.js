import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { Roboto_Condensed } from "next/font/google";
import { FiArrowLeft } from "react-icons/fi";
import Header from "@/Components/common/Header";

const roboto_condensed = Roboto_Condensed({ weight: ["400", "700"], subsets: ["latin"] });

const ESTADO_OPCIONES = [
  { value: "TODOS", label: "Todos" },
  { value: "AUTORIZADO", label: "Autorizados" },
  { value: "DENEGADO", label: "Denegados" },
];

const RANGO_OPCIONES = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Última semana" },
  { value: "fecha", label: "Fecha específica" },
];

function formatFecha(createdAt) {
  if (!createdAt) return "";
  return new Date(createdAt).toLocaleDateString();
}

function segmentBtnCls(active) {
  return `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
    active
      ? "bg-cyan-600 text-white"
      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
  } ${roboto_condensed.className}`;
}

export default function ControlAcceso() {
  const router = useRouter();
  const queryHangarId = typeof router.query.hangar === "string" ? router.query.hangar : "";

  const [hangares, setHangares] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS");
  const [rangoFiltro, setRangoFiltro] = useState("hoy");
  const [fechaFiltro, setFechaFiltro] = useState("");

  const hangarId = queryHangarId;
  const hangarActual = hangares?.find((h) => h.id === hangarId) || null;

  useEffect(() => {
    if (!router.isReady) return;

    let cancelado = false;

    fetch("/api/hangars")
      .then((res) => (res.ok ? res.json() : { hangars: [] }))
      .then((data) => {
        if (cancelado) return;
        const lista = data.hangars || [];
        setHangares(lista);
        if (!queryHangarId && lista.length === 1) {
          router.replace({ pathname: "/control_acceso_personal", query: { hangar: lista[0].id } });
        }
      })
      .catch(() => {
        if (!cancelado) setHangares([]);
      });

    return () => {
      cancelado = true;
    };
  }, [router, router.isReady, queryHangarId]);

  const cargar = useCallback(() => {
    if (!hangarId) return;

    const params = new URLSearchParams({ hangarId });
    if (estadoFiltro !== "TODOS") params.set("estado", estadoFiltro);
    params.set("rango", rangoFiltro);
    if (rangoFiltro === "fecha" && fechaFiltro) params.set("fecha", fechaFiltro);

    fetch(`/api/acceso?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setEventos(data.eventos || []);
      })
      .catch(() => {
        // el próximo intervalo reintenta
      });
  }, [hangarId, estadoFiltro, rangoFiltro, fechaFiltro]);

  useEffect(() => {
    if (!hangarId) return;
    if (rangoFiltro === "fecha" && !fechaFiltro) return;

    cargar();
    const i = setInterval(cargar, 1500);
    return () => clearInterval(i);
  }, [hangarId, cargar, rangoFiltro, fechaFiltro]);

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-28 text-slate-900 sm:px-8 md:px-12">

      <div className="fixed left-0 top-0 z-50 w-screen">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-5xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${roboto_condensed.className}`}>
              Control de acceso
            </h1>
            <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
              {hangarActual
                ? `Eventos de acceso de ${hangarActual.label}`
                : "Eventos de acceso del personal en tiempo real"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {hangarId && (
              <Link
                href="/control_acceso_personal"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
              >
                <FiArrowLeft className="h-4 w-4" />
                Todos los hangares
              </Link>
            )}

            <Link
              href="/inicio"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
            >
              <FiArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </div>
        </div>

        {!hangarId && hangares && hangares.length > 1 && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className={`mb-3 text-sm font-semibold text-slate-700 ${roboto_condensed.className}`}>
              Elige un hangar
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {hangares.map((h) => (
                <Link
                  key={h.id}
                  href={{ pathname: "/control_acceso_personal", query: { hangar: h.id } }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-cyan-400 hover:bg-cyan-50 transition"
                >
                  {h.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {!hangarId && hangares && hangares.length === 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
              No perteneces a ningún hangar todavía.
            </p>
          </section>
        )}

        {hangarId && (
          <>
            {/* FILTROS */}
            <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {ESTADO_OPCIONES.map((op) => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => setEstadoFiltro(op.value)}
                    className={segmentBtnCls(estadoFiltro === op.value)}
                  >
                    {op.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {RANGO_OPCIONES.map((op) => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => setRangoFiltro(op.value)}
                    className={segmentBtnCls(rangoFiltro === op.value)}
                  >
                    {op.label}
                  </button>
                ))}
                {rangoFiltro === "fecha" && (
                  <input
                    type="date"
                    value={fechaFiltro}
                    onChange={(e) => setFechaFiltro(e.target.value)}
                    className={`rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                  />
                )}
              </div>
            </section>

            {/* TABLA */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">

                <table className="min-w-full divide-y divide-slate-200">

                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Tarjeta (UID)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Hora</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Estado</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {eventos.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-500">
                          No hay eventos para mostrar con estos filtros.
                        </td>
                      </tr>
                    )}

                    {eventos.map((e, i) => (
                      <tr key={i} className={`hover:bg-slate-50 ${e.estado === "DENEGADO" ? "bg-red-50/60" : ""}`}>

                        <td className="px-4 py-3">{e.nombre}</td>

                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.uid}</td>

                        <td className="px-4 py-3">{formatFecha(e.createdAt)}</td>

                        <td className="px-4 py-3">{e.hora}</td>

                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              e.estado === "DENEGADO"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {e.estado === "DENEGADO" ? "DENEGADO" : "Acceso autorizado"}
                          </span>
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            </section>
          </>
        )}

      </main>
    </div>
  );
}
