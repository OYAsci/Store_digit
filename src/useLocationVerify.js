/**
 * useLocationVerify
 *
 * Location verification is based only on IP geolocation.
 * It also auto-selects app language from detected IP country.
 */

import { useState, useCallback } from "react";
import i18n from "./i18n";

// ─── Config ─────────────────────────────────────────────────────────────────

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

async function getIPSignal() {
  try {
    const res = await fetch(IP_API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (d.error) throw new Error(d.reason || "IP API returned an error");
    return {
      source: "ip",
      available: true,
      countryCode: d.country_code,
      country: d.country_name,
      city: d.city,
      region: d.region,
      timezone: d.timezone,
      lat: d.latitude,
      lon: d.longitude,
      ip: d.ip,
      org: d.org,
    };
  } catch (err) {
    return { source: "ip", available: false, error: err.message };
  }
}

function evaluate({ ipSignal }) {
  const granted = ipSignal.available;
  return {
    granted,
    agreements: granted ? ["IP geolocation signal collected successfully"] : [],
    conflicts: granted ? [] : ["Could not collect IP geolocation signal"],
    notes: granted ? [`Detected IP country: ${ipSignal.countryCode || "unknown"}`] : [],
    availableCount: granted ? 1 : 0,
    summary: granted
      ? "Access granted — IP address verified"
      : "Access denied — IP geolocation is unavailable",
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useLocationVerify() {
  const [status, setStatus]   = useState("idle"); // idle | loading | granted | denied | error
  const [details, setDetails] = useState(null);

  const verify = useCallback(async () => {
    setStatus("loading");
    setDetails(null);

    try {
      const ipSignal = await getIPSignal();
      const language = getLanguageForCountry(ipSignal.countryCode);
      applyLanguage(language);

      const result = evaluate({ ipSignal });
      setDetails({ ip: ipSignal, language, ...result });
      setStatus(result.granted ? "granted" : "denied");
    } catch (err) {
      setDetails({ error: err.message });
      setStatus("error");
    }
  }, []);

  return { status, details, verify };
}
