import { redirect } from "next/navigation";
import { verifyCareersAdmin } from "@/lib/admin-auth";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import CareersAdminClient from "./CareersAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminCareersPage() {
  const auth = await verifyCareersAdmin();

  // Unauthenticated — redirect to login
  if (auth.status === 401) {
    redirect("/login");
  }

  // Authenticated but not authorized — show styled access denied
  if (!auth.isAuthorized) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center min-h-[70vh] bg-background text-foreground">
          <div className="max-w-md w-full mx-auto p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/30">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Access Denied</h1>
            <p className="text-muted-foreground text-sm mb-6">
              {auth.error || "You are not authorized to access this page. Only the designated careers administrator may view this dashboard."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20"
            >
              Return to Home
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return <CareersAdminClient initialAdminEmail={auth.adminEmail} />;
}
