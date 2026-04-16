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
    <div className="relative z-0 flex min-h-screen w-full flex-col items-center justify-center text-black">
      <StarAnimation />

      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
        <img
          src="/Fondo_Hangares.jpg"
          alt="Inicio"
          className="w-full h-full object-cover opacity-50"
        />
      </div>              

   

      {session ? (
        <section className="relative z-10 flex flex-col items-center justify-center w-full px-6 text-center">
          <h1 className={`${jersey_10.className} text-center text-8xl text-white`}>
            Bienvenido a AeroGuardia
          </h1>
          <h1 className={`${jersey_10.className} text-center text-7xl text-yellow-600`}>
            {session.user.name}

          </h1>
          <Link
            href="/inicio"
            className="group relative w-3/12 h-auto p-2 border-2 m-4
                  border-double border-blue-700 rounded-xl bg-black/60 hover:scale-95 
                  transform transition duration-500 ease-in-out overflow-hidden"
          >
            <span
              className="relative z-10 w-full h-full text-white  flex items-center 
                    justify-center py-2 transition duration-500 ease-in-out"
            >
              <p className={`${jersey_10.className} text-center text-4xl text-white group-hover:text-black`}>
                Gestionar Hangares
              </p>
            </span>
            <span className="absolute top-0 left-0 w-full h-full bg-blue-300/60 
                  transform translate-y-full group-hover:translate-y-0 transition duration-500 
                  ease-in-out" />

          </Link>


        </section>
      ) : (
        <section className="relative flex flex-col justify-center items-center z-10 w-8/12 rounded-3xl border-solid border-2
        border-violet-500 p-4 shadow-2xl shadow-black/60 bg-black/40">
          <div className="w-full h-auto flex items-center justify-center my-3">
            <h1 className={`${jersey_10.className} text-center text-6xl text-white`}>
              Bienvenido a AeroGuardia
            </h1>

          </div>

          <div className="w-full h-full flex justify-center items-center">
            <div className="flex flex-col items-center justify-center w-1/2">
              <img
                src="/Logo_AeroGuardia.png"
                alt="Logo de AeroGuardia"
                className="w-10/12 h-auto mb-6 rounded-full object-cover object-center border-2 border-black
                shadow-lg shadow-black/50"
              />

            </div>

            <div
              className="w-1/2 h-auto flex flex-col items-center justify-center rounded-3xl p-4 m-4
              gap-2">

              <h1 className={`${jersey_10.className} text-center text-4xl text-white`}>
                Seguridad Inteligente para tu Hangar
              </h1>

              <div className="w-full h-auto flex justify-center items-center gap-2">

                <div className="w-2/3 h-auto flex flex-col justify-center items-start gap-4">
                  <div className="w-full h-auto flex items-center justify-start gap-2">
                    <AiFillSafetyCertificate size={40} className="text-green-500" />
                    <p className={`${jersey_10.className} text-clip text-3xl text-white`}>
                      Control de accesos
                    </p>
                  </div>

                  <div className="w-full h-auto flex items-center justify-start gap-2">
                    <FaComputer size={40} className="text-blue-500" />
                    <p className={`${jersey_10.className} text-clip text-3xl text-white`}>
                      Monitoreo en tiempo real
                    </p>
                  </div>

                  <div className="w-full h-auto flex items-center justify-start gap-2">
                    <FaBell size={40} className="text-red-500" />
                    <p className={`${jersey_10.className} text-clip text-3xl text-white`}>
                      Alertas automáticas
                    </p>
                  </div>
                </div>

                <div className="relative w-1/2 h-72 flex justify-center items-center overflow-hidden rounded-lg">
                  <img
                    src="/Avion_Monitor_2.png"
                    alt="Control de Acceso"
                    className="h-full w-full object-contain object-center scale-[1.5]"
                  />

                </div>

              </div>
              <div className="w-full h-auto flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => signIn("google")}
                  className="group relative w-10/12 h-auto p-2 border-2 sm:border-3 md:border-4 
                  border-double border-blue-700 rounded-xl bg-black/60 hover:scale-95 
                  transform transition duration-500 ease-in-out overflow-hidden"
                >
                  <span
                    className="relative z-10 w-full h-full text-white text-center  flex items-center 
                    justify-center py-2 md:py-3 transition duration-500 ease-in-out"
                  >
                    <p className={`${jersey_10.className} text-center text-3xl text-white group-hover:text-black`}>
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
