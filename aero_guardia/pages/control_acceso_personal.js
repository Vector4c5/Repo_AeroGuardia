import Link from "next/link";
import { useEffect, useState } from "react";
import { Roboto_Condensed } from "next/font/google";
import { FiArrowLeft } from "react-icons/fi";
import Header from "@/Components/common/Header";

const roboto_condensed = Roboto_Condensed({ weight: ["400", "700"], subsets: ["latin"] });

export default function ControlAcceso() {

  const [eventos, setEventos] = useState([]);

  const cargar = async () => {
    const res = await fetch("/api/acceso");
    const data = await res.json();

    const filtrados = data.eventos.filter(e => e.estado === "AUTORIZADO");
    setEventos(filtrados);
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
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-bold text-slate-900 ${roboto_condensed.className}`}>Control de acceso</h1>
            <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
              Eventos autorizados del personal en tiempo real
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/inicio"
              className={`inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
            >
              <FiArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
            <Link
              href="/emergencia"
              className={`rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 ${roboto_condensed.className}`}
            >
              Emergencias
            </Link>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 ${roboto_condensed.className}`}
                  >
                    Nombre
                  </th>
                  <th
                    scope="col"
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 ${roboto_condensed.className}`}
                  >
                    Hora
                  </th>
                  <th
                    scope="col"
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 ${roboto_condensed.className}`}
                  >
                    Tipo
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {eventos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center">
                      <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
                        No hay eventos autorizados para mostrar.
                      </p>
                    </td>
                  </tr>
                )}

                {eventos.map((e, i) => (
                  <tr key={i} className="transition hover:bg-slate-50">
                    <td className={`whitespace-nowrap px-4 py-3 text-sm text-slate-800 ${roboto_condensed.className}`}>
                      {e.nombre}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-sm text-slate-700 ${roboto_condensed.className}`}>
                      {e.hora}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide ${roboto_condensed.className} ${
                          e.tipo === "ENTRADA"
                            ? "bg-cyan-100 text-cyan-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {e.tipo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}