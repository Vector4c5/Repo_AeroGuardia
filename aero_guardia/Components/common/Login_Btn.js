import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Jersey_10 } from "next/font/google";
import { FaUser } from "react-icons/fa";
import { MdPlayArrow } from "react-icons/md";
import { useEffect, useRef, useState } from "react";

const jersey_10 = Jersey_10({ weight: "400", subsets: ["latin"] });

export default function Login_Btn() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

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
        return (
            <div ref={menuRef} className={`relative ${jersey_10.className}`}>
                <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="group flex items-center gap-2 sm:gap-4 mx-2 hover:translate-x-2 sm:hover:translate-x-4 transition duration-300 ease-in-out"
                >
                    <div className="opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out scale-125 sm:scale-150">
                        <MdPlayArrow />
                    </div>
                    <div className="scale-125 sm:scale-150">
                        <FaUser />
                    </div>
                    <p className="text-xl sm:text-3xl truncate overflow-hidden whitespace-nowrap text-ellipsis max-w-40 sm:max-w-56">
                        {session.user?.name || session.user?.email || "Usuario"}
                    </p>
                </button>

                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl z-50 rounded-3xl overflow-hidden">
                        <Link
                            href="/inicio"
                            className="group flex items-center px-2 py-2 text-xl text-black hover:bg-yellow-100"
                            onClick={() => setMenuOpen(false)}
                        >
                            <div className="opacity-0 group-hover:opacity-100 transition duration-500 ease-in-out">
                                <MdPlayArrow />
                            </div>
                            <p className="group-hover:translate-x-2 transition duration-300 ease-in-out">
                                Perfil
                            </p>
                        </Link>

                        <button
                            type="button"
                            onClick={() => signOut()}
                            className="w-full group flex items-center px-2 py-2 text-xl text-black hover:bg-yellow-100"
                        >
                            <div className="opacity-0 group-hover:opacity-100 transition duration-500 ease-in-out">
                                <MdPlayArrow />
                            </div>
                            <p className="group-hover:translate-x-2 transition duration-300 ease-in-out">                                Cerrar sesion
                            </p>
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`relative ${jersey_10.className}`}>
            <button
                type="button"
                onClick={() => signIn("google")}
                className="group flex items-center gap-2 sm:gap-4 mx-2 hover:translate-x-2 sm:hover:translate-x-4 transition duration-300 ease-in-out"
            >
                <div className="opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out scale-125 sm:scale-150">
                    <MdPlayArrow />
                </div>
                <div className="scale-125 sm:scale-150">
                    <FaUser />
                </div>
                <p className="text-xl sm:text-3xl">Inicia sesion</p>
            </button>
        </div>
    );
}

