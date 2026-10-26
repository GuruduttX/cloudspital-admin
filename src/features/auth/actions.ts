"use server";

import { redirect } from "next/navigation";
import { authenticate, endSession } from "@/services/auth";

export async function signIn(_previous: { error: string }, form: FormData) {
  let result;
  try {
    result = await authenticate(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
  } catch {
    return { error: "Sign-in is temporarily unavailable. Please try again shortly." };
  }
  if (result === "limited") return { error: "Too many sign-in attempts. Wait 15 minutes before trying again." };
  if (result !== "success") return { error: "Incorrect email or password." };
  redirect("/");
}

export async function signOut() {
  await endSession();
  redirect("/login");
}
