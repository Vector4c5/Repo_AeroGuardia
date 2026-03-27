import StarAnimation from "@/Components/common/StartAnimation";
import Link from "next/link";

export default function Home() {
  return (
    <div
      className="relative z-0 flex min-h-screen w-full flex-col items-center justify-center text-black"
    >
      <StarAnimation />

      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
        <img
          src="/Fondo_Hangares.jpg"
          alt="Inicio"
          className="w-full h-full object-cover opacity-60"
        />
      </div>

      <div className="w-6/12 h-64 flex items-center justify-start bg-white rounded-lg 
      shadow-lg shadow-black z-10 overflow-hidden">

        <img
          src="/Logo_AeroGuardia.png"
          alt=""
          className="h-full w-auto object-contain pointer-events-none"
        />

        <div 
        className="w-full h-full flex flex-col items-center justify-center mx-4">
          <h2 className="text-xl font-bold text-gray-800 text-center">
            Tu seguridad es nuestra prioridad
          </h2>
          <p className="text-gray-600 text-center mt-2">
            Confía en nuestra experiencia y tecnología para proteger tus operaciones aéreas.
          </p>
          <Link
            href="/inicio"
            className="group relative mt-4 overflow-hidden rounded-lg border-2 border-black bg-yellow-300 px-6 py-2 transition duration-500 ease-in-out hover:scale-105"
          >
            <span className="relative z-10 text-black transition duration-500 ease-in-out">
              Iniciar Sesion
            </span>
            <span className="absolute top-0 left-0 h-full w-full bg-amber-400 transform -translate-x-full group-hover:translate-x-0 transition duration-500 ease-in-out"></span>
          </Link>
        </div>


      </div>


    </div>
  );
}
