import StarAnimation from "@/Components/common/StartAnimation";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Jersey_10 } from "next/font/google";
import { AiFillSafetyCertificate } from "react-icons/ai";
import { FaComputer } from "react-icons/fa6";
import { FaBell } from "react-icons/fa6";


const jersey_10 = Jersey_10({ weight: '400', subsets: ['latin'] });

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="relative z-0 flex min-h-screen w-full flex-col items-center justify-center text-black bg-black">
      <StarAnimation />
      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
        <img
          src="/Fondo_Hangares.jpg"
          alt="Inicio"
          className="w-full h-full object-cover opacity-50"
        />
      </div>

      {session ? (
        <section className="relative z-10 flex flex-col items-center justify-center w-full px-4 sm:px-6 text-center gap-4 sm:gap-6">
          <h1 className={`${jersey_10.className} text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white`}>
            Bienvenido a AeroGuardia
          </h1>
          <h1 className={`${jersey_10.className} text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-yellow-600`}>
            {session.user.name}
          </h1>
          <Link
            href="/inicio"
            className="group relative w-full sm:w-8/12 md:w-7/12 lg:w-6/12 xl:w-5/12 h-auto p-2 sm:p-3 border-2
                  border-double border-blue-700 rounded-xl bg-black/60 hover:scale-95 
                  transform transition duration-500 ease-in-out overflow-hidden"
          >
            <span
              className="relative z-10 w-full h-full text-white flex items-center 
                    justify-center py-2 sm:py-3 transition duration-500 ease-in-out"
            >
              <p className={`${jersey_10.className} text-center text-lg sm:text-2xl md:text-3xl lg:text-4xl text-white group-hover:text-black`}>
                Gestionar Hangares
              </p>
            </span>
            <span className="absolute top-0 left-0 w-full h-full bg-blue-300/60 
                  transform translate-y-full group-hover:translate-y-0 transition duration-500 
                  ease-in-out" />
          </Link>
        </section>
      ) : (
        <section className="relative flex flex-col justify-center items-center z-10 w-11/12 sm:w-11/12 md:w-10/12 lg:w-8/12 xl:w-7/12 rounded-2xl sm:rounded-3xl border-solid border-2
        border-violet-500 p-4 sm:p-4 md:p-6 shadow-2xl shadow-black/60 bg-black/40 mx-3 sm:mx-6 md:mx-8 lg:mx-auto gap-4 sm:gap-6 my-4 sm:my-8 md:my-10">
          <div className="w-full h-auto flex items-center justify-center">
            <h1 className={`${jersey_10.className} text-center text-4xl sm:text-4xl md:text-5xl lg:text-6xl text-white`}>
              Bienvenido a AeroGuardia
            </h1>
          </div>

          <div className="w-full h-auto flex flex-col lg:flex-row justify-center items-center gap-4 sm:gap-6">
            {/* Logo */}
            <div className="flex flex-col items-center justify-center w-full lg:w-1/2 px-2">
              <img
                src="/Logo_AeroGuardia.png"
                alt="Logo de AeroGuardia"
                className="w-7/12 sm:w-6/12 md:w-5/12 lg:w-10/12 h-auto mb-3 sm:mb-4 md:mb-6 rounded-full object-cover object-center border-2 border-black
                shadow-lg shadow-black/50"
              />
            </div>

            {/* Contenido */}
            <div className="w-full lg:w-1/2 h-auto flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 gap-3 sm:gap-4">
              <h1 className={`${jersey_10.className} text-center text-2xl sm:text-2xl md:text-3xl lg:text-4xl text-white px-2`}>
                Seguridad Inteligente para tu Hangar
              </h1>

              <div className="w-full h-auto flex flex-col lg:flex-row justify-center items-center gap-4 sm:gap-6">
                {/* Features */}
                <div className="w-full lg:w-full h-auto flex flex-col justify-center items-center gap-3 sm:gap-4 px-2">
                  <div className="w-full h-auto flex items-center justify-center gap-2 sm:gap-3">
                    <AiFillSafetyCertificate size={32} className="text-green-500 shrink-0" />
                    <p className={`${jersey_10.className} text-base sm:text-base md:text-lg lg:text-2xl text-white`}>
                      Control de accesos
                    </p>
                  </div>

                  <div className="w-full h-auto flex items-center justify-center gap-2 sm:gap-3">
                    <FaComputer size={32} className="text-blue-500 shrink-0" />
                    <p className={`${jersey_10.className} text-base sm:text-base md:text-lg lg:text-2xl text-white`}>
                      Monitoreo en tiempo real
                    </p>
                  </div>

                  <div className="w-full h-auto flex items-center justify-center gap-2 sm:gap-3">
                    <FaBell size={32} className="text-red-500 shrink-0" />
                    <p className={`${jersey_10.className} text-base sm:text-base md:text-lg lg:text-2xl text-white`}>
                      Alertas automáticas
                    </p>
                  </div>
                </div>

              </div>

              {/* Botón */}
              <div className="w-full h-auto flex items-center justify-center px-2 mt-2 sm:mt-4">
                <button
                  type="button"
                  onClick={() => signIn("google")}
                  className="group relative w-full sm:w-11/12 md:w-10/12 h-auto p-2 sm:p-3 border-2 sm:border-3
                  border-double border-blue-700 rounded-xl bg-black/60 hover:scale-95 
                  transform transition duration-500 ease-in-out overflow-hidden"
                >
                  <span
                    className="relative z-10 w-full h-full text-white text-center flex items-center 
                    justify-center py-3 sm:py-3 transition duration-500 ease-in-out"
                  >
                    <p className={`${jersey_10.className} text-center text-lg sm:text-lg md:text-xl lg:text-3xl text-white group-hover:text-black px-2`}>
                      Continuar Con Google
                    </p>
                  </span>
                  <span className="absolute top-0 left-0 w-full h-full bg-blue-300/60 
                  transform translate-y-full group-hover:translate-y-0 transition duration-500 
                  ease-in-out" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
