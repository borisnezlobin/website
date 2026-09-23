"use client";

import { AdminAuthProvider, useAdminAuth } from "./admin-auth";
import AdminNav from "./admin-nav";
import LoginForm from "./login-form";

function SignedInGate({ children }: { children: React.ReactNode }) {
  const { phase } = useAdminAuth();

  if (phase === "restoring") return <main className="min-h-screen bg-light-background dark:bg-dark-background" />;
  if (phase === "signed-out") return <LoginForm />;

  return (
    <section className="flex min-h-screen flex-col bg-light-background dark:bg-dark-background md:flex-row">
      <AdminNav />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </section>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <SignedInGate>{children}</SignedInGate>
    </AdminAuthProvider>
  );
}
