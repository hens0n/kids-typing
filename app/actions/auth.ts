"use server";

import { redirect } from "next/navigation";

import {
  authenticateUser,
  clearSession,
  createSession,
  createUser,
  validateRegistration,
} from "@/lib/auth";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function registerAction(formData: FormData) {
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
  } catch {
    redirect("/?error=That%20username%20is%20already%20taken.&tab=create");
  }

  redirect("/learn");
}

export async function loginAction(formData: FormData) {
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
