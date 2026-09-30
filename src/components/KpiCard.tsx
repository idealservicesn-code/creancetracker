import Link from "next/link";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
  hint,
  href,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "brand" | "red" | "emerald" | "amber";
  hint?: string;
  /** Si fourni, toute la carte devient cliquable et redirige vers cette page. */
  href?: string;
}) {
  const toneClasses = {
    brand: "bg-brand-50 text-brand-600",
    red: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  }[tone];

  const content = (
    <>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", toneClasses)}>
          <Icon size={20} />
        </div>
        {href && (
          <ChevronRight
            size={16}
            className="text-gray-300 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
          />
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="card group flex items-start justify-between transition hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-brand-200"
      >
        {content}
      </Link>
    );
  }

  return <div className="card flex items-start justify-between">{content}</div>;
}
