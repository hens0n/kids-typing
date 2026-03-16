import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth-panel";
import { getCurrentUser } from "@/lib/auth";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/learn");
  }

  const params = await searchParams;
  const errorMessage = typeof params.error === "string" ? params.error : undefined;
  const tab = params.tab === "create" ? "create" : "login";

  return (
    <main className="marketing-page">
      <AuthPanel activeTab={tab} errorMessage={errorMessage} />
    </main>
  );
}
