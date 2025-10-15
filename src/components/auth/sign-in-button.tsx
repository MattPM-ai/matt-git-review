"use client";

import { signIn } from "next-auth/react";
import GithubIcon from "@/components/Icon/github";

export function SignInButton() {
  return (
    <button
      onClick={() => signIn("github")}
      className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 hover:cursor-pointer"
    >
      <GithubIcon className="h-5 w-5" />
      Sign in with GitHub
    </button>
  );
}
