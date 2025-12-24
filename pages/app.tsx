import Head from "next/head";

export default function AppPage() {
  return (
    <>
      <Head>
        <title>FuyouAI App</title>
      </Head>
      <iframe
        src="https://fuyouai-promtos.vercel.app"
        style={{
          width: "100%",
          height: "100vh",
          border: "none",
        }}
      />
    </>
  );
}
