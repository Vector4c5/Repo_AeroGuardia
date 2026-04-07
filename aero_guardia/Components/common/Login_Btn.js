import { useSession, signIn, signOut } from "next-auth/react";

export default function Login_Btn() {

    const { data: session } = useSession();
    if (session) {
        return (
            <>
            Estas logueado como {session.user.email} <br />
            <button onClick={() => signOut()}>Cerrar Sesion</button>

            </>
        )
    } {
        return (
        <>
            No estas logueado <br />
            <button onClick={() => signIn()}>Iniciar Sesion con google</button>
        </>
    )
    }
    
}

