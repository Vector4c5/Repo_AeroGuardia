import { IoHomeOutline } from "react-icons/io5";
import { MdPlayArrow } from "react-icons/md";
import { FaBars, FaClipboardList, FaTimes } from "react-icons/fa";
import { RiAlarmWarningFill } from "react-icons/ri";
import { FaPlaneLock } from "react-icons/fa6";
import Link from "next/link";
import { Jersey_10 } from "next/font/google";
import { Roboto_Condensed } from "next/font/google";
import LoginBtn from "@/Components/common/Login_Btn";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

const jersey_10 = Jersey_10({ weight: "400", subsets: ["latin"] });
const roboto_condensed = Roboto_Condensed({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const navPages = [
    {
      name: "Home",
      href: "/inicio",
      icon: <IoHomeOutline />,
    },
    {
      name: "Pendientes",
      href: "/pending",
      icon: <FaClipboardList />,
    },
    {
      name: "Acceso",
      href: "/control_acceso_personal",
      icon: <FaPlaneLock />,
    },
    {
      name: "Emergencia",
      href: "/emergencia",
      icon: <RiAlarmWarningFill />,
    },
  ];

  if (isAdmin) {
    navPages.push({
      name: "Admin",
      href: "/admin/dashboard",
      icon: <FaClipboardList />,
    });
  }

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header
      className={`relative z-50 w-full border-b border-slate-200/80 bg-white/90 shadow-md shadow-gray-500/20 backdrop-blur-sm ${roboto_condensed.className}`}
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-5 sm:py-2.5 lg:px-8">
        <Link
          href="/inicio"
          className="flex min-w-0 items-center gap-2 sm:gap-3"
        >
          <img
            src="/Logo_AeroGuardia.png"
            alt="Logo AeroGuardia"
            className="h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover shadow-md shadow-gray-400 sm:h-12 sm:w-12 lg:h-14 lg:w-14 lg:border-[3px]"
          />
          <h1
            className={`truncate text-xl text-black sm:text-2xl md:text-3xl lg:text-4xl ${jersey_10.className}`}
          >
            AeroGuardia
          </h1>
        </Link>

        {/* Desktop / large tablets: full nav from lg */}
        <nav className="hidden items-center gap-1 lg:flex xl:gap-2">
          {navPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group flex items-center gap-1.5 rounded-lg px-2 py-2 transition hover:bg-slate-100 xl:gap-2 xl:px-3"
            >
              <span className="opacity-0 transition group-hover:opacity-100">
                <MdPlayArrow className="text-black" />
              </span>
              <span className="text-lg text-black xl:text-xl">{page.icon}</span>
              <span className="whitespace-nowrap text-base font-semibold text-black xl:text-lg">
                {page.name}
              </span>
            </Link>
          ))}
          <div className="ml-2 border-l border-slate-200 pl-3">
            <LoginBtn />
          </div>
        </nav>

        {/* Compact icon nav for md–lg (avoids crushed labels) */}
        <nav className="hidden items-center gap-1 md:flex lg:hidden">
          {navPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              title={page.name}
              aria-label={page.name}
              className="flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 text-black transition hover:bg-slate-100"
            >
              <span className="text-xl">{page.icon}</span>
              <span className="mt-0.5 text-[10px] font-semibold leading-none">
                {page.name}
              </span>
            </Link>
          ))}
          <div className="ml-1 border-l border-slate-200 pl-2">
            <LoginBtn />
          </div>
        </nav>

        {/* Mobile hamburger */}
        <div ref={menuRef} className="relative md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-black transition hover:bg-slate-100"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <ul className="flex flex-col p-2">
                {navPages.map((page) => (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-100"
                    >
                      <span className="opacity-0 transition group-hover:opacity-100">
                        <MdPlayArrow className="text-black" />
                      </span>
                      <span className="text-lg text-black">{page.icon}</span>
                      <span className="text-base font-semibold text-black">
                        {page.name}
                      </span>
                    </Link>
                  </li>
                ))}
                <li className="mt-1 border-t border-slate-200 pt-2">
                  <LoginBtn mobile />
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
