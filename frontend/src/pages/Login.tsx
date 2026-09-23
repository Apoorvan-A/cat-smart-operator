import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { USE_MOCK } from "@/api";
import { IconExcavator, IconShield, IconSpark, IconBolt } from "@/components/icons";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("op1001");
  const [password, setPassword] = useState("demo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch {
      setError("Sign-in failed. Check your credentials and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid h-full lg:grid-cols-2">
      {/* Brand / value panel */}
      <div className="relative hidden overflow-hidden border-r border-line lg:block">
        <div className="grid-lines absolute inset-0 opacity-60" />
        <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-cat/10 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-sev-info/10 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-cat text-ink-900 shadow-glow-cat">
              <IconExcavator width={24} height={24} />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold uppercase tracking-wider">CAT Operator</div>
              <div className="text-xs text-fg-faint">Smart Assistant</div>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="h-display text-balance text-4xl leading-tight text-fg">
              An intelligent companion for the whole shift.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              Not a dashboard. A safety-first operator assistant that turns raw machine telemetry into clear answers —
              <span className="text-fg"> Am I safe? Is my machine healthy? Am I on track?</span>
            </p>
            <ul className="mt-8 space-y-3">
              <Feature icon={<IconShield />} title="Deterministic safety" text="Rules decide safety events — never a guess." />
              <Feature icon={<IconBolt />} title="Real-time alerts" text="Proximity, seatbelt and health, pushed live." />
              <Feature icon={<IconSpark />} title="Grounded AI" text="Explanations built only from backend facts." />
            </ul>
          </div>

          <p className="text-xs text-fg-faint">
            Prototype · Caterpillar campus recruitment hackathon. Telemetry is <span className="text-cat">simulated</span> and clearly labelled.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 inline-grid h-12 w-12 place-items-center rounded-xl bg-cat text-ink-900 shadow-glow-cat">
              <IconExcavator width={26} height={26} />
            </div>
            <h1 className="h-display text-2xl text-fg">CAT Smart Operator</h1>
          </div>

          <div className="eyebrow mb-2">Operator sign-in</div>
          <h2 className="h-display mb-6 text-2xl text-fg">Start your shift</h2>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Operator ID">
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="op1001"
              />
            </Field>
            <Field label="Passcode">
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••"
              />
            </Field>

            {error && (
              <p className="rounded-lg border border-sev-critical/30 bg-sev-critical/10 px-3 py-2 text-xs text-sev-critical">
                {error}
              </p>
            )}

            <button className="btn-primary w-full py-3 text-base" disabled={busy}>
              {busy ? "Signing in…" : "Sign in & begin shift"}
            </button>
          </form>

          {USE_MOCK && (
            <div className="mt-6 rounded-xl border border-line bg-ink-700/60 px-4 py-3 text-xs text-fg-muted">
              <span className="font-semibold text-fg">Demo mode.</span> Any credentials work — you'll sign in as{" "}
              <span className="text-cat">Jane Doe · OP1001</span> on machine EXC001.
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #232A36;
          background: #12161F;
          padding: 0.75rem 0.9rem;
          font-size: 0.95rem;
          color: #E7ECF3;
          transition: border-color .15s, box-shadow .15s;
        }
        .input::placeholder { color: #5C6a7d; }
        .input:focus { outline: none; border-color: rgba(255,205,17,.6); box-shadow: 0 0 0 3px rgba(255,205,17,.12); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-ink-700 text-cat">
        {icon}
      </span>
      <div>
        <div className="text-sm font-semibold text-fg">{title}</div>
        <div className="text-xs text-fg-muted">{text}</div>
      </div>
    </li>
  );
}
