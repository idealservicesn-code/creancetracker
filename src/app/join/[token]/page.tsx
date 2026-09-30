import { AlertTriangle, Landmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n";
import JoinForm from "@/components/JoinForm";
import LocaleSwitcher from "@/components/LocaleSwitcher";

export default async function JoinPage({ params }: { params: { token: string } }) {
  const locale = getLocale();
  const dict = getDictionary(locale);
  const t = dict.join;

  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_invitation", { p_token: params.token });
  const invitation = Array.isArray(data) ? data[0] : data;
  const valid = !error && invitation && invitation.valid;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50/60 via-gray-50 to-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <LocaleSwitcher current={locale} variant="light" />
        </div>
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <Landmark size={24} />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Créances Tracker</h1>
        </div>

        {valid ? (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {t.subtitleFor} <span className="font-semibold text-brand-700">{invitation.organization_name}</span>
              </p>
            </div>
            <JoinForm dict={dict} token={params.token} prefilledEmail={invitation.email} />
          </>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white/90 p-6 text-center shadow-xl shadow-gray-200/60">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertTriangle size={22} />
            </div>
            <p className="text-sm text-gray-600">{t.invalid}</p>
          </div>
        )}
      </div>
    </div>
  );
}
