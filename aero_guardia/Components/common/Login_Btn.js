import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Roboto_Condensed } from "next/font/google";
import { FaUser } from "react-icons/fa";
import { MdPlayArrow } from "react-icons/md";
import { useEffect, useRef, useState } from "react";

const roboto_condensed = Roboto_Condensed({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export default function Login_Btn({ mobile = false }) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (session) {
    if (mobile) {
      return (
        <Link
          href="/profile"
          className={`group flex w-full items-center gap-2 rounded-lg px-2 py-2 transition duration-300 ease-in-out hover:bg-slate-100 ${roboto_condensed.className}`}
        >
          <div className="opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out">
            <MdPlayArrow />
          </div>
          <div className="scale-125">
            <FaUser />
          </div>
          <p className="max-w-44 truncate overflow-hidden whitespace-nowrap text-ellipsis text-base font-semibold text-black">
            {session.user?.username ||
              session.user?.name ||
              session.user?.email ||
              "Usuario"}
          </p>
        </Link>
      );
    }

    return (
      <div
        ref={menuRef}
        className={`relative w-full ${roboto_condensed.className}`}
      >
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="group mx-2 flex items-center gap-2 transition duration-300 ease-in-out hover:translate-x-2 sm:gap-4 sm:hover:translate-x-4"
        >
          <div className="opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out scale-125 sm:scale-150">
            <MdPlayArrow />
          </div>
          <div className="scale-125 sm:scale-150">
            <FaUser />
          </div>
          <p className="truncate overflow-hidden whitespace-nowrap text-ellipsis text-xl max-w-40 sm:max-w-56 sm:text-2xl">
            {session.user?.username ||
              session.user?.name ||
              session.user?.email ||
              "Usuario"}
          </p>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl z-50 rounded-3xl overflow-hidden border border-slate-200">
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="w-full group flex items-center px-2 py-2 text-xl text-black hover:bg-yellow-100"
            >
              <div className="opacity-0 group-hover:opacity-100 transition duration-500 ease-in-out">
                <MdPlayArrow />
              </div>
              <p className="group-hover:translate-x-2 transition duration-300 ease-in-out">
                Perfil
              </p>
            </Link>

            {isAdmin && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMenuOpen(false)}
                className="w-full group flex items-center px-2 py-2 text-xl text-black hover:bg-yellow-100"
              >
                <div className="opacity-0 group-hover:opacity-100 transition duration-500 ease-in-out">
                  <MdPlayArrow />
                </div>
                <p className="group-hover:translate-x-2 transition duration-300 ease-in-out">
                  Admin
                </p>
              </Link>
            )}

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full group flex items-center px-2 py-2 text-xl text-black hover:bg-yellow-100"
            >
              <div className="opacity-0 group-hover:opacity-100 transition duration-500 ease-in-out">
                <MdPlayArrow />
              </div>
              <p className="group-hover:translate-x-2 transition duration-300 ease-in-out">
                Cerrar sesion
              </p>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full ${roboto_condensed.className}`}>
      <Link
        href="/login"
        className={`group flex items-center gap-2 sm:gap-4 ${
          mobile
            ? "w-full justify-start px-2 py-2 rounded-lg hover:bg-slate-100"
            : "mx-2 hover:translate-x-2 sm:hover:translate-x-4"
        } transition duration-300 ease-in-out`}
      >
        <div className="opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out scale-125 sm:scale-150">
          <MdPlayArrow />
        </div>
        <div className="scale-125 sm:scale-150">
          <FaUser />
        </div>
        <p
          className={`${
            mobile ? "text-base font-semibold text-black" : "text-xl sm:text-2xl"
          }`}
        >
          Inicia sesion
        </p>
      </Link>
    </div>
  );
}
