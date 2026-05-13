import { redirect } from "next/navigation";
import { createSession, isAuthed, verifyPassword } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const ok = await verifyPassword(password);
  if (!ok) redirect("/login?error=1");
  await createSession();
  redirect("/dialer");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthed()) redirect("/dialer");
  const sp = await searchParams;

  return (
    <main className="min-h-screen grid place-items-center bg-bg text-text px-4">
      <form
        action={login}
        className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 shadow-card"
      >
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Pro Dialer</h1>
        <p className="text-sm text-muted mb-6">Sign in to continue</p>
        <label className="text-xs uppercase tracking-wider text-muted">Password</label>
        <input
          type="password"
          name="password"
          required
          autoFocus
          className="mt-1 w-full bg-elevated border border-border rounded-lg px-3 py-2 outline-none focus:border-accent transition-colors"
        />
        {sp.error && (
          <p className="mt-3 text-sm text-danger">Incorrect password.</p>
        )}
        <button
          type="submit"
          className="mt-6 w-full bg-accent hover:bg-accentMuted text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
