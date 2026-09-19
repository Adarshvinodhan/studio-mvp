import { LogIn } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { Alert, Field, SubmitButton, inputClass } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const next = params.next || "/";

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, #c5ddd1 0%, #eef4f0 42%, #d8ebe2 100%)",
        }}
      />

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card/95 p-6 shadow-raised backdrop-blur-sm sm:p-8">
          <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-accent" />
          <h1 className="text-center font-display text-3xl tracking-[0.2em] text-accent-dark uppercase sm:text-4xl">
            Camtrio
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            Sign in to manage quotations, payments and catalogues
          </p>

          {error ? (
            <Alert tone="danger" className="mt-5">
              Invalid username or password. Please try again.
            </Alert>
          ) : null}

          <form action={loginAction} className="mt-6 space-y-5">
            <input type="hidden" name="next" value={next} />
            <Field label="Username">
              <input
                name="username"
                autoComplete="username"
                autoFocus
                required
                className={inputClass}
                defaultValue="admin"
              />
            </Field>
            <Field label="Password">
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={inputClass}
              />
            </Field>
            <SubmitButton
              className="w-full"
              size="lg"
              pendingLabel="Signing in…"
              icon={<LogIn className="size-4" />}
            >
              Sign in
            </SubmitButton>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-muted">
          Camtrio Weddings · Studio Management
        </p>
      </div>
    </div>
  );
}
