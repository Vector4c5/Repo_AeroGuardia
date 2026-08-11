import "@/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import ProfileGate from "@/Components/common/ProfileGate";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </Head>
      <ProfileGate>
        <Component {...pageProps} />
      </ProfileGate>
      <ToastContainer
        position="top-right"
        autoClose={4200}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        limit={4}
      />
    </SessionProvider>
  );
}
