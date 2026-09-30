import { BarChart3, Landmark, MapPin, ShieldCheck, TrendingUp } from "lucide-react";
import SignupForm from "@/components/SignupForm";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { getDictionary, getLocale } from "@/lib/i18n";

function Feature({ icon: Icon, label }: { icon: typeof TrendingUp; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 ring-1 ring-inset ring-white/15 backdrop-blur-sm">
      <Icon size={16} className="shrink-0 text-white" />
      <span className="text-xs font-medium text-white/90">{label}</span>
    </div>
  );
}

export default function SignupPage() {
  const locale = getLocale();
  const dict = getDictionary(locale);
  const t = dict.landing;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="animate-blob pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="animate-blob animation-delay-2000 pointer-events-none absolute -right-16 -bottom-32 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="animate-blob animation-delay-4000 pointer-events-none absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm">
              <Landmark size={22} />
            </div>
            <span className="text-lg font-semibold text-white">Créances Tracker</span>
          </div>
          <LocaleSwitcher current={locale} />
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">{t.sub}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Feature icon={TrendingUp} label={t.features[0].title} />
            <Feature icon={MapPin} label={t.features[1].title} />
            <Feature icon={BarChart3} label={t.features[2].title} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-brand-50/70">
            <ShieldCheck size={14} />
            Vos données sont isolées et protégées par organisation.
          </div>
        </div>

        <div className="relative z-10 text-xs text-brand-50/60">
          © {new Date().getFullYear()} Créances Tracker
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-brand-50/60 via-gray-50 to-gray-50 px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-sm lg:hidden">
          <LocaleSwitcher current={locale} variant="light" />
        </div>
        <SignupForm dict={dict} locale={locale} />
      </div>
    </div>
  );
}
