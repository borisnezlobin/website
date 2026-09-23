"use client";

import { useState } from "react";
import { LockKeyIcon, SignInIcon } from "@phosphor-icons/react/dist/ssr";
import { useAdminAuth } from "./admin-auth";
import { Button } from "./button";
import { TextInput } from "./text-input";

export default function LoginForm() {
  const { signIn, wasRejected } = useAdminAuth();
  const [password, setPassword] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password) signIn(password);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-light-background p-4 dark:bg-dark-background">
      <form
        onSubmit={submit}
        className="flex w-full max-w-xs flex-col gap-4 rounded-xl bg-white p-6 shadow-lg ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10"
      >
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <LockKeyIcon size={20} weight="duotone" aria-hidden />
          Site admin
        </h1>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted dark:text-muted-dark">Admin password</span>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-invalid={wasRejected}
            aria-describedby={wasRejected ? "admin-login-error" : undefined}
            autoFocus
          />
        </label>
        {wasRejected && (
          <p id="admin-login-error" role="alert" className="text-sm text-primary">
            The server rejected that password. Check it and sign in again.
          </p>
        )}
        <Button type="submit" variant="primary" disabled={!password}>
          <SignInIcon size={18} aria-hidden />
          Sign in
        </Button>
      </form>
    </main>
  );
}
