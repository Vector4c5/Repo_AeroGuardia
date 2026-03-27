export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/inicio",
      permanent: false,
    },
  };
}

export default function LandinfRedirect() {
  return null;
}
