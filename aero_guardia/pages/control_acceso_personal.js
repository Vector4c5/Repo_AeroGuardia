import Link from "next/link";
import { useEffect, useState } from "react";
import { Roboto_Condensed } from "next/font/google";
import { FiArrowLeft } from "react-icons/fi";
import Header from "@/Components/common/Header";

const roboto_condensed = Roboto_Condensed({ weight: ["400", "700"], subsets: ["latin"] });

export default function ControlAcceso() {

  const [eventos, setEventos] = useState([]);

  const cargar = async () => {
    try {
      const res = await fetch("/api/acceso");
      if (!res.ok) return;
      const data = await res.json();

      const filtrados = (data.eventos || []).filter(e => e.estado === "AUTORIZADO");
      setEventos(filtrados);
    } catch {
      // el próximo intervalo reintenta
    }
  };

  const enviar = async (data) => {
    await fetch("/api/acceso", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    cargar();
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

        {/* HEADER */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${roboto_condensed.className}`}>
              Control de acceso
            </h1>
            <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
              Eventos autorizados del personal en tiempo real
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/inicio"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
            >
              <FiArrowLeft className="h-4 w-4" />
              Volver
            </Link>

            <Link
              href="/emergencia"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Emergencias
            </Link>
          </div>
        </div>

        {/* BOTONES LIMPIOS */}
        <div className="flex gap-3">

          <button
            onClick={() => enviar({
              uid: "60DB8E21",
              estado: "AUTORIZADO",
              nombre: "Hector"
            })}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Acceso Hector
          </button>

          <button
            onClick={() => enviar({
              uid: "32AA5421",
              estado: "AUTORIZADO",
              nombre: "Carlo"
            })}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Acceso Carlo
          </button>

          <button
            onClick={() => enviar({
              uid: "0000",
              estado: "DENEGADO",
              nombre: "Desconocido"
            })}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
          >
            Acceso Denegado
          </button>

        </div>

        {/* TABLA */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">

            <table className="min-w-full divide-y divide-slate-200">

              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Tipo</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {eventos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-slate-500">
                      No hay eventos autorizados para mostrar.
                    </td>
                  </tr>
                )}

                {eventos.map((e, i) => (
                  <tr key={i} className="hover:bg-slate-50">

                    <td className="px-4 py-3">{e.nombre}</td>

                    <td className="px-4 py-3">{e.hora}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          e.tipo === "ENTRADA"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
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