import Head from "next/head";
import LandingView from "@/views/public/LandingView";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>SmartPark — Sistem Parkir Cerdas</title>
        <meta name="description" content="Sistem parkir cerdas berbasis IoT dengan monitoring slot parkir secara real-time." />
      </Head>
      <LandingView />
    </>
  );
}