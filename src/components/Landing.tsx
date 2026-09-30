import Link from "next/link";
import { BarChart3, Landmark, MapPin, TrendingUp, ArrowRight } from "lucide-react";
import RotatingHeadline from "@/components/RotatingHeadline";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { Locale } from "@/lib/types";
import { getDictionary } from "@/lib/i18n";

const FEATURE_ICONS = [TrendingUp, MapPin, BarChart3];

export default function Landing({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.landing;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      {/* Filigrane décoratif : le nom de la plateforme répété en fond, à peine visible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 flex select-none flex-wrap gap-x-10 gap-y-6 overflow-hidden opacity-[0.05]"
        style={{ transform: "rotate(-8deg) scale(1.3)" }}
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className="whitespace-nowrap text-4xl font-black tracking-tight">
            {t.footer}
          </span>
        ))}
      </div>

      {/* Fond dégradé + halos colorés animés */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br from-brand-900 via-gray-950 to-gray-950" />
      <div className="pointer-events-none absolute -left-32 top-0 -z-10 h-96 w-96 animate-blob rounded-full bg-brand-500 opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 -z-10 h-96 w-96 animate-blob animation-delay-2000 rounded-full bg-emerald-400 opacity-10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-96 w-96 animate-blob animation-delay-4000 rounded-full bg-teal-300 opacity-10 blur-3xl" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-700">
            <Landmark size={18} />
          </div>
          <span className="text-sm font-semibold tracking-tight">Créances Tracker</span>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher current={locale} />
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-white/90 transition hover:text-white sm:inline-block"
          >
            {dict.nav.login}
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
          >
            {dict.nav.signup}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-12 text-center sm:pt-20">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-brand-100 ring-1 ring-white/20">
          {t.badge}
        </span>

        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
          <RotatingHeadline lines={t.headlines} />
        </h1>

        <p className="mt-6 max-w-xl text-base text-white/70 sm:text-lg">{t.sub}</p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-400"
          >
            {t.ctaSignup}
            <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            {t.ctaLogin}
          </Link>
        </div>

        <div className="mt-24 grid w-full gap-4 sm:grid-cols-3">
          {t.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            return (
              <div
                key={f.title}
                className="rounded-2xl bg-white/5 p-6 text-left ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/10"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-200">
                  <Icon size={20} />
                </div>
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="mt-1.5 text-sm text-white/60">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {t.footer}
      </footer>
    </div>
  );
}
