import type { GetServerSideProps } from "next";
import Head from "next/head";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/types";
import AdminLayout from "@/components/layout/AdminLayout";
import HeatmapView from "@/views/admin/HeatmapView";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isLoggedIn || !session.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  if (session.user.role !== "admin") {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return { props: { user: session.user } };
};

interface Props {
  user: { username: string; role: string };
}

export default function AdminHeatmapPage({ user }: Props) {
  return (
    <>
      <Head><title>SmartPark — Heatmap</title></Head>
      <AdminLayout username={user.username} role={user.role}>
        <HeatmapView />
      </AdminLayout>
    </>
  );
}