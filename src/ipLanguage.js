import i18n from "./i18n";

const IP_API_URL = "https://ipapi.co/json/";

const COUNTRY_TO_LANGUAGE = {
  FR: "fr",
  BE: "fr",
  CH: "fr",
  CA: "fr",
  MA: "ar",
  DZ: "ar",
  TN: "ar",
  EG: "ar",
  SA: "ar",
  AE: "ar",
  QA: "ar",
  KW: "ar",
  OM: "ar",
  BH: "ar",
  JO: "ar",
  LB: "ar",
  IQ: "ar",
  SY: "ar",
  LY: "ar",
  SD: "ar",
  YE: "ar",
};

function getLanguageForCountry(countryCode) {
  if (!countryCode) return "en";
  return COUNTRY_TO_LANGUAGE[countryCode] || "en";
}

function applyLanguage(language) {
  i18n.changeLanguage(language);
  localStorage.setItem("language", language);
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
}

export async function detectAndApplyLanguageFromIP() {
  try {
    const res = await fetch(IP_API_URL, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.error) return;
    const language = getLanguageForCountry(data.country_code);
    applyLanguage(language);
  } catch {
    // Keep current language when IP lookup is unavailable.
  }
}
