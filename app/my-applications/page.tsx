import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyApplicationsClient from "./MyApplicationsClient";

export const dynamic = "force-dynamic";

export default async function MyApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <MyApplicationsClient
      initialUser={{
        id: user.id,
        email: user.email || "",
      }}
    />
  );
}
