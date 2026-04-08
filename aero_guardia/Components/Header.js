import { IoHomeOutline } from "react-icons/io5";
import { MdPlayArrow } from "react-icons/md";
import { GiOpenBook } from "react-icons/gi";
import { FaBars } from "react-icons/fa"; // Importar el ícono de menú hamburguesa
import Link from "next/link";
import { Jersey_10 } from '@next/font/google';
import LoginBtn from "@/components/common/Login-Btn";
import { useState } from "react";

const jersey_10 = Jersey_10({ weight: '400', subsets: ['latin'] });

export default function Header({ userName = "Player" }) {
    const [menuOpen, setMenuOpen] = useState(false); // Estado para controlar el menú desplegable

    const navPages = [
        {
            name: "Home",
            href: "/landing",
            icon: <IoHomeOutline />
        },
        {
            name: "Library",
            href: "/library",
            icon: <GiOpenBook />
        },
    ];

    return (
        <main
            className={`flex sm:flex-row items-center justify-between w-full h-auto py-2 sm:py-4 border-double border-8 border-purple-400 bg-black bg-opacity-50 ${jersey_10.className}
            shadow-lg shadow-gray-500`}
        >
            {/* Logo y título */}
            <div className="flex items-center justify-start w-auto">
                <div className="relative w-20 h-20 sm:w-16 sm:h-16 mx-4">
                    <img
                        src="/Logo_The_Cavern.jpeg"
                        alt="Logo"
                        className="border-4 border-white rounded-full shadow-md shadow-gray-500"
                    />
                </div>
                <h1 className="text-4xl whitespace-nowrap sm:text-6xl text-white text-left">
                    The Cavern
                </h1>
            </div>

            {/* Navegación */}
            <div className="relative w-auto flex justify-end items-center ml-auto">
                {/* Menú hamburguesa para pantallas pequeñas */}
                <div className="sm:hidden">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-white text-xl px-6 py-4 bg-black bg-opacity-70 flex items-center justify-center"
                    >
                        <FaBars />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-black bg-opacity-80 rounded-lg shadow-lg z-50">
                            <ul className="flex flex-col gap-2 p-4">
                                {navPages.map((page) => (
                                    <li
                                        key={page.href}
                                        className="group flex text-center items-center"
                                    >
                                        <Link
                                            href={page.href}
                                            className="flex items-center gap-2 sm:gap-4 mx-1 group-hover:translate-x-2 sm:group-hover:translate-x-4 transition 
                                            duration-300 ease-in-out"
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out scale-125 sm:scale-150">
                                                <MdPlayArrow />
                                            </div>
                                            <div className="scale-125 sm:scale-150">
                                                {page.icon}
                                            </div>
                                            <p className="text-xl sm:text-3xl">
                                                {page.name}
                                            </p>
                                        </Link>
                                    </li>
                                ))}
                                <li className="group flex text-center items-center">
                                    <LoginBtn />
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Navegación para pantallas grandes */}
                <nav className="hidden sm:flex justify-end items-center gap-3 sm:gap-5 px-4">
                    {navPages.map((page) => (
                        <li
                            key={page.href}
                            className="group flex text-center items-center"
                        >
                            <Link
                                href={page.href}
                                className="flex items-center gap-2 sm:gap-4 mx-1 group-hover:translate-x-2 sm:group-hover:translate-x-4 transition 
                                duration-300 ease-in-out"
                            >
                                <div className="opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out scale-125 sm:scale-150">
                                    <MdPlayArrow />
                                </div>
                                <div className="scale-125 sm:scale-150">
                                    {page.icon}
                                </div>
                                <p className="text-xl sm:text-3xl">
                                    {page.name}
                                </p>
                            </Link>
                        </li>
                    ))}
                    <div className="mt-4 sm:mt-0">
                        <LoginBtn />
                    </div>
                </nav>
            </div>
        </main>
    );
}