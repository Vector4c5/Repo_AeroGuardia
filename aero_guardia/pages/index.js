import Link from "next/link";
import { useSession } from "next-auth/react";
import { Montserrat } from "next/font/google";
import WelcomeDashboard from "@/Components/common/WelcomeDashboard";

const jersey_10 = Montserrat({ weight: ["700", "800"], subsets: ["latin"] });

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="relative z-0 min-h-screen w-full bg-white text-black">
      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
        <img
          src="/Fondo_Hangares.jpg"
          alt="Inicio"
          className="w-full h-full object-cover opacity-[0.07]"
        />
        <div className="absolute inset-0 bg-white/70" />
      </div>

      {session ? (
        <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4 text-center sm:gap-6 sm:px-6">
          <h1 className={`${jersey_10.className} tracking-tight text-4xl text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl`}>
            Bienvenido a AeroGuardia
          </h1>
          <h2 className={`${jersey_10.className} tracking-tight text-2xl text-blue-800 sm:text-3xl md:text-4xl xl:text-5xl`}>
            {session.user.name}
          </h2>
          <Link
            href="/inicio"
            className="mt-2 w-full rounded-xl bg-slate-900 p-3 text-white shadow-md transition duration-300 hover:scale-[0.98] hover:bg-slate-800 hover:shadow-lg sm:mt-4 sm:w-8/12 md:w-7/12 lg:w-6/12 xl:w-5/12"
          >
            <p className={`${jersey_10.className} text-center text-lg sm:text-2xl md:text-3xl lg:text-4xl`}>
              Gestionar Hangares
            </p>
          </Link>
        </div>
      ) : (
        <WelcomeDashboard ctaHref="/login" />
      )}
    </div>
  );
}
