import type { GetServerSideProps } from "next";
import Head from "next/head";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { getDummyParkingData } from "@/lib/data";
import type { SessionData, ParkingData } from "@/types";
import AdminLayout from "@/components/layout/AdminLayout";
import DashboardView from "@/views/user/DashboardView";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isLoggedIn || !session.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  if (session.user.role !== "admin") {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  const initialData = getDummyParkingData();
  return { props: { user: session.user, initialData } };
};

interface Props {
  user: { username: string; role: string };
  initialData: ParkingData;
}

export default function AdminDashboardPage({ user, initialData }: Props) {
  return (
    <>
      <Head><title>SmartPark — Admin Dashboard</title></Head>
      <AdminLayout username={user.username} role={user.role}>
        <DashboardView data={initialData} />
      </AdminLayout>
    </>
  );
}