import Head from "next/head";
import PublicDashboardView from "@/views/public/DashboardView";

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>SmartPark — Parking Monitor</title>
        <meta name="description" content="Status slot parkir real-time" />
      </Head>
      <PublicDashboardView />
    </>
  );
}