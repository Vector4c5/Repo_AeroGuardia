import Link from "next/link";
import { useEffect, useState } from "react";
import { Roboto_Condensed } from "next/font/google";
import { FiArrowLeft, FiAlertTriangle } from "react-icons/fi";
import Header from "@/Components/common/Header";

const roboto_condensed = Roboto_Condensed({ weight: ["400", "700"], subsets: ["latin"] });

export default function Emergencia() {

  const [eventos, setEventos] = useState([]);

  const cargar = async () => {
    try {
      const res = await fetch("/api/acceso");
      if (!res.ok) return;
      const data = await res.json();

      const filtrados = (data.eventos || []).filter(e => e.estado === "DENEGADO");
      setEventos(filtrados);
    } catch {
      // el próximo intervalo reintenta
    }
  };

  useEffect(() => {
    cargar();
    const i = setInterval(cargar, 1500);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-28 text-slate-900 sm:px-8 md:px-12">
      <div className="fixed left-0 top-0 z-50 w-screen">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-bold text-red-700 ${roboto_condensed.className}`}>Emergencias</h1>
            <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
              Eventos denegados detectados en tiempo real
            </p>
          </div>
          <Link
            href="/control_acceso_personal"
            className={`inline-flex w-fit items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
          >
            <FiArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>

        <section className="rounded-xl border border-red-200 bg-white p-4 shadow-sm sm:p-6">
          {eventos.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
                No hay emergencias activas en este momento.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {eventos.map((e, i) => (
              <article
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">
                    <FiAlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold text-red-900 ${roboto_condensed.className}`}>
                      {e.nombre}
                    </p>
                    <p className={`text-xs text-red-700 ${roboto_condensed.className}`}>
                      Acceso denegado
                    </p>
                  </div>
                </div>

                <span className={`rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 ${roboto_condensed.className}`}>
                  {e.hora}
                </span>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}