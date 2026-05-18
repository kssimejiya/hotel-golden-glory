"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FirebaseError,
} from "firebase/app";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";

type Stage = "sign-in" | "reset";

interface LoginFormProps {
  redirectTo?: string;
}

function mapFirebaseError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Try again in a few minutes or use password reset.";
      case "auth/user-disabled":
        return "This account has been disabled. Contact the site owner.";
      case "auth/network-request-failed":
        return "Network error — check your connection and try again.";
      default:
        return "Sign-in failed. Please try again.";
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return "Sign-in failed. Please try again.";
}

export function LoginForm({ redirectTo = "/admin" }: LoginFormProps) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    startTransition(async () => {
      try {
        const credential = await signInWithEmailAndPassword(
          clientAuth(),
          email,
          password
        );
        const idToken = await credential.user.getIdToken(true);
        const res = await fetch("/api/admin/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(body?.error ?? "Could not start admin session.");
          // Don't keep a stale Firebase client session on a rejected admin login.
          try {
            await clientAuth().signOut();
          } catch {}
          return;
        }
        router.replace(redirectTo);
        router.refresh();
      } catch (err) {
        setError(mapFirebaseError(err));
      }
    });
  }

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Enter your email to receive a reset link.");
      return;
    }
    startTransition(async () => {
      try {
        await sendPasswordResetEmail(clientAuth(), email);
        setInfo(
          `If an account exists for ${email}, a password reset email is on the way. Check your inbox (and spam).`
        );
        setStage("sign-in");
      } catch (err) {
        // Per Firebase guidance, don't reveal whether the email exists.
        // Show the same friendly message regardless.
        if (
          err instanceof FirebaseError &&
          err.code === "auth/invalid-email"
        ) {
          setError("Please enter a valid email address.");
        } else if (err instanceof FirebaseError && err.code === "auth/network-request-failed") {
          setError("Network error — check your connection and try again.");
        } else {
          setInfo(
            `If an account exists for ${email}, a password reset email is on the way. Check your inbox (and spam).`
          );
          setStage("sign-in");
        }
      }
    });
  }

  return (
    <form
      onSubmit={stage === "sign-in" ? handleSignIn : handleReset}
      className="space-y-4"
    >
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}
      {info && (
        <div
          role="status"
          className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
        >
          {info}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-charcoal"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-border-warm bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          placeholder="you@example.com"
        />
      </div>

      {stage === "sign-in" && (
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-charcoal"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border-warm bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            placeholder="••••••••"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-charcoal px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-charcoal/90 disabled:opacity-50"
      >
        {pending
          ? stage === "sign-in"
            ? "Signing in..."
            : "Sending reset email..."
          : stage === "sign-in"
            ? "Sign In"
            : "Send password reset email"}
      </button>

      <div className="text-center">
        {stage === "sign-in" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              setInfo(null);
              setStage("reset");
            }}
            className="text-xs text-soft-gray hover:text-charcoal disabled:opacity-50"
          >
            Forgot password?
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              setInfo(null);
              setStage("sign-in");
            }}
            className="text-xs text-soft-gray hover:text-charcoal disabled:opacity-50"
          >
            Back to sign-in
          </button>
        )}
      </div>
    </form>
  );
}
