// Partie de lib/i18n.ts qui ne dépend PAS de next/headers, afin de pouvoir être
// importée depuis des Client Components ("use client") sans faire fuiter
// next/headers dans leur bundle (ce qui casse le build Next.js).
import { Locale } from "@/lib/types";

export const LOCALE_COOKIE = "creances_locale";
export const LOCALES: Locale[] = ["fr", "en", "ar"];
export const RTL_LOCALES: Locale[] = ["ar"];

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export type Dict = {
  nav: { login: string; signup: string };
  landing: {
    badge: string;
    headlines: string[];
    sub: string;
    ctaLogin: string;
    ctaSignup: string;
    features: { title: string; desc: string }[];
    footer: string;
  };
  login: {
    welcome: string;
    subtitle: string;
    email: string;
    password: string;
    submit: string;
    secure: string;
    noAccount: string;
    signupLink: string;
    pitchTitle: string;
    pitchSub: string;
    feature1: string;
    feature2: string;
    feature3: string;
  };
  signup: {
    title: string;
    subtitle: string;
    orgName: string;
    orgNamePlaceholder: string;
    logo: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    password: string;
    submit: string;
    haveAccount: string;
    loginLink: string;
    tipsTitle: string;
    tips: string[];
  };
  join: {
    title: string;
    subtitleFor: string;
    invalid: string;
    fullName: string;
    password: string;
    submit: string;
  };
};

const fr: Dict = {
  nav: { login: "Se connecter", signup: "Créer un compte" },
  landing: {
    badge: "Nouveau · Plateforme multi-comptes",
    headlines: [
      "Vos créances, sous contrôle.",
      "Zéro impayé oublié.",
      "Recouvrez plus, stressez moins.",
      "Chaque échéance, à l'œil.",
    ],
    sub: "Créances Tracker centralise vos clients, vos prêts et vos encaissements — avec une carte, des statistiques en direct et une équipe organisée autour de vous.",
    ctaLogin: "Se connecter",
    ctaSignup: "Créer mon compte gratuitement",
    features: [
      { title: "Suivi en temps réel", desc: "Échéances, retards et encaissements à jour à chaque instant." },
      { title: "Carte des clients", desc: "Géolocalisez votre portefeuille, y compris via WhatsApp." },
      { title: "Équipe organisée", desc: "Invitez des superviseurs avec des accès sur-mesure." },
    ],
    footer: "Créances Tracker",
  },
  login: {
    welcome: "Bon retour 👋",
    subtitle: "Connectez-vous pour accéder à votre tableau de bord.",
    email: "Adresse email",
    password: "Mot de passe",
    submit: "Se connecter",
    secure: "Connexion sécurisée",
    noAccount: "Pas encore de compte ?",
    signupLink: "Créer un compte",
    pitchTitle: "Pilotez votre portefeuille de créances, où que vous soyez.",
    pitchSub: "Suivi des échéances, encaissements, clients et statistiques en temps réel — tout au même endroit.",
    feature1: "Suivi en temps réel",
    feature2: "Carte des clients",
    feature3: "Statistiques avancées",
  },
  signup: {
    title: "Créez votre espace",
    subtitle: "Votre organisation, vos couleurs, votre équipe — prêt en 2 minutes.",
    orgName: "Nom de votre entreprise / organisation",
    orgNamePlaceholder: "Ex: Ideal Services",
    logo: "Logo (optionnel)",
    fullName: "Votre nom complet",
    fullNamePlaceholder: "Ex: Awa Ndiaye",
    email: "Adresse email",
    password: "Mot de passe",
    submit: "Créer mon compte",
    haveAccount: "Déjà un compte ?",
    loginLink: "Se connecter",
    tipsTitle: "Bon à savoir",
    tips: [
      "Vous serez administrateur de votre organisation : vous seul décidez qui rejoint votre équipe.",
      "Vous pourrez ajouter votre logo et vos couleurs à tout moment depuis les paramètres.",
      "Vos données restent strictement séparées de celles des autres organisations.",
    ],
  },
  join: {
    title: "Rejoindre l'équipe",
    subtitleFor: "Vous avez été invité(e) à rejoindre",
    invalid: "Ce lien d'invitation n'est plus valide. Demandez un nouveau lien à votre administrateur.",
    fullName: "Votre nom complet",
    password: "Choisissez un mot de passe",
    submit: "Rejoindre",
  },
};

const en: Dict = {
  nav: { login: "Log in", signup: "Create an account" },
  landing: {
    badge: "New · Multi-account platform",
    headlines: [
      "Your receivables, under control.",
      "Zero unpaid invoice forgotten.",
      "Collect more, stress less.",
      "Every due date, in sight.",
    ],
    sub: "Créances Tracker centralizes your clients, loans and collections — with a map, live statistics and a team organized around you.",
    ctaLogin: "Log in",
    ctaSignup: "Create my free account",
    features: [
      { title: "Real-time tracking", desc: "Due dates, delays and collections, always up to date." },
      { title: "Client map", desc: "Geolocate your portfolio, including via WhatsApp." },
      { title: "Organized team", desc: "Invite supervisors with tailored access levels." },
    ],
    footer: "Créances Tracker",
  },
  login: {
    welcome: "Welcome back 👋",
    subtitle: "Log in to access your dashboard.",
    email: "Email address",
    password: "Password",
    submit: "Log in",
    secure: "Secure connection",
    noAccount: "No account yet?",
    signupLink: "Create an account",
    pitchTitle: "Manage your receivables portfolio, wherever you are.",
    pitchSub: "Due dates, collections, clients and statistics — all in real time, all in one place.",
    feature1: "Real-time tracking",
    feature2: "Client map",
    feature3: "Advanced statistics",
  },
  signup: {
    title: "Create your workspace",
    subtitle: "Your organization, your colors, your team — ready in 2 minutes.",
    orgName: "Your company / organization name",
    orgNamePlaceholder: "e.g. Ideal Services",
    logo: "Logo (optional)",
    fullName: "Your full name",
    fullNamePlaceholder: "e.g. Jane Doe",
    email: "Email address",
    password: "Password",
    submit: "Create my account",
    haveAccount: "Already have an account?",
    loginLink: "Log in",
    tipsTitle: "Good to know",
    tips: [
      "You'll be the administrator of your organization: only you decide who joins your team.",
      "You can add your logo and colors any time from settings.",
      "Your data stays strictly separate from other organizations'.",
    ],
  },
  join: {
    title: "Join the team",
    subtitleFor: "You've been invited to join",
    invalid: "This invitation link is no longer valid. Ask your administrator for a new one.",
    fullName: "Your full name",
    password: "Choose a password",
    submit: "Join",
  },
};

const ar: Dict = {
  nav: { login: "تسجيل الدخول", signup: "إنشاء حساب" },
  landing: {
    badge: "جديد · منصة متعددة الحسابات",
    headlines: [
      "ديونك، تحت السيطرة.",
      "لا فاتورة منسية بعد اليوم.",
      "حصّل أكثر، بقلق أقل.",
      "كل موعد استحقاق، تحت العين.",
    ],
    sub: "تجمع Créances Tracker عملاءك وقروضك وتحصيلاتك في مكان واحد — مع خريطة وإحصاءات مباشرة وفريق منظم حولك.",
    ctaLogin: "تسجيل الدخول",
    ctaSignup: "إنشاء حسابي مجانًا",
    features: [
      { title: "متابعة لحظية", desc: "المواعيد والتأخيرات والتحصيلات محدثة باستمرار." },
      { title: "خريطة العملاء", desc: "حدد مواقع عملائك، حتى عبر واتساب." },
      { title: "فريق منظم", desc: "ادعُ مشرفين بصلاحيات مخصصة." },
    ],
    footer: "Créances Tracker",
  },
  login: {
    welcome: "أهلاً بعودتك 👋",
    subtitle: "سجّل الدخول للوصول إلى لوحة التحكم الخاصة بك.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    submit: "تسجيل الدخول",
    secure: "اتصال آمن",
    noAccount: "ليس لديك حساب بعد؟",
    signupLink: "إنشاء حساب",
    pitchTitle: "أدر محفظة ديونك أينما كنت.",
    pitchSub: "المواعيد والتحصيلات والعملاء والإحصاءات — كلها في الوقت الفعلي وفي مكان واحد.",
    feature1: "متابعة لحظية",
    feature2: "خريطة العملاء",
    feature3: "إحصاءات متقدمة",
  },
  signup: {
    title: "أنشئ مساحتك",
    subtitle: "مؤسستك، ألوانك، فريقك — جاهز في دقيقتين.",
    orgName: "اسم شركتك / مؤسستك",
    orgNamePlaceholder: "مثال: Ideal Services",
    logo: "الشعار (اختياري)",
    fullName: "اسمك الكامل",
    fullNamePlaceholder: "مثال: فاطمة ندياي",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    submit: "إنشاء حسابي",
    haveAccount: "لديك حساب بالفعل؟",
    loginLink: "تسجيل الدخول",
    tipsTitle: "من المفيد معرفته",
    tips: [
      "ستكون مسؤول مؤسستك: أنت من يقرر من ينضم إلى فريقك.",
      "يمكنك إضافة شعارك وألوانك في أي وقت من الإعدادات.",
      "تبقى بياناتك منفصلة تمامًا عن بيانات المؤسسات الأخرى.",
    ],
  },
  join: {
    title: "انضم إلى الفريق",
    subtitleFor: "تمت دعوتك للانضمام إلى",
    invalid: "رابط الدعوة هذا لم يعد صالحًا. اطلب رابطًا جديدًا من مسؤولك.",
    fullName: "اسمك الكامل",
    password: "اختر كلمة مرور",
    submit: "انضمام",
  },
};

const DICTS: Record<Locale, Dict> = { fr, en, ar };

export function getDictionary(locale: Locale): Dict {
  return DICTS[locale] ?? fr;
}
