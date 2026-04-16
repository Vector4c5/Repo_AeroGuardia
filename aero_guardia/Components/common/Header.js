import { IoHomeOutline } from "react-icons/io5";
import { MdPlayArrow } from "react-icons/md";
import { FaBars } from "react-icons/fa"; // Importar el ícono de menú hamburguesa
import Link from "next/link";
import { Jersey_10 } from '@next/font/google';
import { Roboto_Condensed } from "next/font/google";
import LoginBtn from "@/Components/common/Login_Btn";
import { useState } from "react";

const jersey_10 = Jersey_10({ weight: '400', subsets: ['latin'] });
const roboto_condensed = Roboto_Condensed({ weight: ['400', '700'], subsets: ['latin'] });


export default function Header({ userName = "Player" }) {
    const [menuOpen, setMenuOpen] = useState(false); // Estado para controlar el menú desplegable

    const navPages = [
        {
            name: "Home",
            href: "/inicio",
            icon: <IoHomeOutline />
        }
    ];

    return (
        <main
            className={`flex items-center justify-between w-full h-auto py-2 sm:py-3 px-3 sm:px-6 md:px-8
                bg-white bg-opacity-50 ${roboto_condensed.className}
                shadow-lg shadow-gray-500/50 text-black`}
        >
            {/* Logo y título */}
            <div className="flex items-center justify-start w-auto gap-2 sm:gap-4">
                <div className="relative w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 pointer-none">
                    <img
                        src="/Logo_AeroGuardia.png"
                        alt="Logo"
                        className="w-full h-full border-2 sm:border-3 md:border-4 border-white rounded-full shadow-md shadow-gray-500"
                    />
                </div>

                <h1 className={`text-2xl sm:text-3xl md:text-5xl whitespace-nowrap text-black text-left ${jersey_10.className}`}>
                    AeroGuardia
                </h1>
            </div>

            {/* Navegación */}
            <div className="relative w-auto flex justify-end items-center ml-auto">
                {/* Menú hamburguesa para pantallas pequeñas */}
                <div className="sm:hidden">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-black text-lg px-4 py-3 bg-white hover:bg-slate-100 rounded-lg border border-slate-400 flex items-center justify-center transition"
                    >
                        <FaBars />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-64 max-w-[90vw] bg-white/95 rounded-lg shadow-lg z-50 border border-slate-300 backdrop-blur-sm">
                            <ul className="flex flex-col gap-2 p-3">
                                {navPages.map((page) => (
                                    <li
                                        key={page.href}
                                        className="group flex text-center items-center w-full"
                                    >
                                        <Link
                                            href={page.href}
                                            className="flex items-center gap-3 mx-1 w-full px-3 py-2 rounded-lg hover:bg-slate-100 group-hover:translate-x-1 transition 
                                            duration-300 ease-in-out"
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out scale-100">
                                                <MdPlayArrow className="text-black text-lg" />
                                            </div>
                                            <div className="scale-125">
                                                {page.icon && <span className="text-black text-lg">{page.icon}</span>}
                                            </div>
                                            <p className="text-base sm:text-lg text-black font-semibold">
                                                {page.name}
                                            </p>
                                        </Link>
                                    </li>
                                ))}
                                <li className="group flex text-center items-center px-2 py-2 w-full">
                                    <LoginBtn mobile />
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Navegación para pantallas grandes */}
                <nav className="hidden sm:flex justify-end items-center gap-2 sm:gap-4 md:gap-5 px-2 sm:px-4">
                    {navPages.map((page) => (
                        <li
                            key={page.href}
                            className="group flex text-center items-center list-none"
                        >
                            <Link
                                href={page.href}
                                className="flex items-center gap-1 sm:gap-2 md:gap-4 mx-1 group-hover:translate-x-2 md:group-hover:translate-x-4 transition 
                                duration-300 ease-in-out"
                            >
                                <div className="opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out scale-100 md:scale-125">
                                    <MdPlayArrow className="text-black text-base md:text-lg" />
                                </div>
                                <div className="scale-100 md:scale-125 text-black text-base md:text-lg">
                                    {page.icon}
                                </div>
                                <p className="text-sm sm:text-base md:text-2xl text-black font-semibold">
                                    {page.name}
                                </p>
                            </Link>
                        </li>
                    ))}
                    <div className="mt-0 ml-2 md:ml-4">
                        <LoginBtn />
                    </div>
                </nav>
            </div>
        </main>
    );
}