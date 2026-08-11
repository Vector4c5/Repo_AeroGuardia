import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Jersey_10 } from "next/font/google";
import { Roboto_Condensed } from "next/font/google";
import { useEffect } from "react";
import { FaUserLock } from "react-icons/fa6";

const jersey_10 = Jersey_10({ weight: "400", subsets: ["latin"] });
const roboto_condensed = Roboto_Condensed({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const PUBLIC_ROUTES = new Set(["/", "/login"]);
const PROFILE_ROUTE = "/profile";

function SessionLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className={`text-slate-600 ${roboto_condensed.className}`}>
        Iniciando sesión...
      </p>
    </div>
  );
}

function CompleteProfileLock({ forceProfile = false }) {
  const router = useRouter();

  useEffect(() => {
    if (forceProfile && router.pathname !== PROFILE_ROUTE) {
      router.replace(PROFILE_ROUTE);
    }
  }, [forceProfile, router]);

  return (
    <div className="min-h-screen w-full bg-white text-slate-900">
      <main className="mx-auto flex min-h-screen w-full items-center justify-center px-3 sm:px-6">
        <section className="flex h-auto w-11/12 flex-col items-stretch gap-4 overflow-hidden rounded-2xl border border-slate-200 p-4 shadow-2xl sm:w-10/12 sm:gap-6 sm:rounded-3xl sm:p-6 md:w-9/12 lg:w-8/12 lg:flex-row xl:w-7/12">
          <div className="flex h-32 w-full items-center justify-center sm:h-40 lg:h-full lg:w-1/2">
            <FaUserLock
              size={120}
              className="text-black sm:h-32 sm:w-32 lg:h-96 lg:w-96"
            />
          </div>
          <div className="flex w-full flex-col items-center justify-center gap-3 lg:w-1/2 lg:items-start">
            <h1
              className={`text-center text-3xl text-black sm:text-4xl md:text-5xl lg:text-left ${jersey_10.className}`}
            >
              AeroGuardia
            </h1>
            <p
              className={`mb-3 text-center text-sm sm:text-base md:text-lg lg:text-left ${roboto_condensed.className}`}
            >
              Debes completar tu registro de datos para continuar. No puedes
              acceder a otras secciones hasta guardar tu perfil.
            </p>
            <Link
              href="/profile"
              className={`inline-flex rounded-lg bg-blue-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-blue-800 ${roboto_condensed.className}`}
            >
              Completar mi perfil
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

/**
 * Blocks the app until the signed-in user completes their profile.
 * Public routes (/ and /login) stay open. /profile is allowed for editing.
 */
export default function ProfileGate({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const path = router.pathname;

  if (status === "loading") {
    return <SessionLoadingScreen />;
  }

  const isAuthenticated = status === "authenticated";
  const profileComplete = Boolean(session?.user?.profileComplete);
  const isPublic = PUBLIC_ROUTES.has(path);
  const isProfilePage = path === PROFILE_ROUTE;

  if (isAuthenticated && !profileComplete && !isProfilePage) {
    // Any other route: only the lock message (same idea as inicio lock)
    return <CompleteProfileLock forceProfile />;
  }

  // Avoid flashing protected chrome on public pages while redirecting after login
  if (isAuthenticated && !profileComplete && isPublic) {
    return <CompleteProfileLock forceProfile />;
  }

  return children;
}

export { CompleteProfileLock, SessionLoadingScreen };
