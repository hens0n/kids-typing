"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  authenticateUser,
  clearSession,
  createSession,
  createUser,
  validateRegistration,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

async function getClientIp() {
  const hdrs = await headers();
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function registerAction(formData: FormData) {
  const ip = await getClientIp();
  if (!checkRateLimit(`register:${ip}`, 5, 60_000)) {
    redirect("/?error=Too%20many%20attempts.%20Please%20wait%20a%20minute.&tab=create");
  }

  const validation = validateRegistration({
    username: getString(formData, "username"),
    displayName: getString(formData, "displayName"),
    password: getString(formData, "password"),
  });

  if (!validation.ok) {
    redirect(`/?error=${encodeURIComponent(validation.error)}&tab=create`);
  }

  try {
    const user = createUser(validation.values);
    await createSession(user.id);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Error & { code: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
    ) {
      redirect("/?error=That%20username%20is%20already%20taken.&tab=create");
    }
    redirect(`/?error=${encodeURIComponent("Account could not be created.")}&tab=create`);
  }

  redirect("/learn");
}

export async function loginAction(formData: FormData) {
  const ip = await getClientIp();
  if (!checkRateLimit(`login:${ip}`, 10, 60_000)) {
    redirect("/?error=Too%20many%20attempts.%20Please%20wait%20a%20minute.&tab=login");
  }

  const username = getString(formData, "username");
  const password = getString(formData, "password");

  if (!username || !password) {
    redirect("/?error=Enter%20both%20username%20and%20password.&tab=login");
  }

  const user = authenticateUser(username, password);

  if (!user) {
    redirect("/?error=That%20login%20did%20not%20work.&tab=login");
  }

  await createSession(user.id);
  redirect("/learn");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
