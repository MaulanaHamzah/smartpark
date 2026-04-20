import type { GetServerSideProps } from "next";
import Head from "next/head";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/types";
import UserLayout from "@/components/layout/UserLayout";
import ProfileView from "@/views/user/ProfileView";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isLoggedIn || !session.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  if (session.user.role === "admin") {
    return { redirect: { destination: "/admin/dashboard", permanent: false } };
  }
  return { props: { user: session.user } };
};

interface Props {
  user: { username: string; role: string };
}

export default function ProfilePage({ user }: Props) {
  return (
    <>
      <Head><title>SmartPark — Profile</title></Head>
      <UserLayout username={user.username} role={user.role}>
        <ProfileView username={user.username} role={user.role} />
      </UserLayout>
    </>
  );
}