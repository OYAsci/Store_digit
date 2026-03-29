/**
 * useLocationVerify
 *
 * Combines three independent location signals:
 *   1. Browser timezone  (Intl API — instant, no network)
 *   2. IP geolocation    (ipapi.co — free, HTTPS, no key needed)
 *   3. GPS               (Geolocation API — requires user permission)
 *
 * Consensus rules:
 *   strict: false (default) → 1+ agreements AND 0 conflicts → GRANTED
 *   strict: true            → ALL available signals must agree → GRANTED
 *
 * GPS denial is treated as a missing signal, NOT a conflict.
 */

import { useState, useCallback } from "react";

// ─── Config ─────────────────────────────────────────────────────────────────

const IP_API_URL = "https://ipapi.co/json/";
const COORD_TOLERANCE_KM = 100; // IP geolocation can be off by ~50-100 km

// ─── Timezone → Country Code ─────────────────────────────────────────────────

const TZ_COUNTRY = {
  // Africa
  "Africa/Abidjan":"CI","Africa/Accra":"GH","Africa/Addis_Ababa":"ET",
  "Africa/Algiers":"DZ","Africa/Asmara":"ER","Africa/Bamako":"ML",
  "Africa/Bangui":"CF","Africa/Banjul":"GM","Africa/Bissau":"GW",
  "Africa/Blantyre":"MW","Africa/Brazzaville":"CG","Africa/Bujumbura":"BI",
  "Africa/Cairo":"EG","Africa/Casablanca":"MA","Africa/Ceuta":"ES",
  "Africa/Conakry":"GN","Africa/Dakar":"SN","Africa/Dar_es_Salaam":"TZ",
  "Africa/Djibouti":"DJ","Africa/Douala":"CM","Africa/El_Aaiun":"EH",
  "Africa/Freetown":"SL","Africa/Gaborone":"BW","Africa/Harare":"ZW",
  "Africa/Johannesburg":"ZA","Africa/Juba":"SS","Africa/Kampala":"UG",
  "Africa/Khartoum":"SD","Africa/Kigali":"RW","Africa/Kinshasa":"CD",
  "Africa/Lagos":"NG","Africa/Libreville":"GA","Africa/Lome":"TG",
  "Africa/Luanda":"AO","Africa/Lubumbashi":"CD","Africa/Lusaka":"ZM",
  "Africa/Malabo":"GQ","Africa/Maputo":"MZ","Africa/Maseru":"LS",
  "Africa/Mbabane":"SZ","Africa/Mogadishu":"SO","Africa/Monrovia":"LR",
  "Africa/Nairobi":"KE","Africa/Ndjamena":"TD","Africa/Niamey":"NE",
  "Africa/Nouakchott":"MR","Africa/Ouagadougou":"BF","Africa/Porto-Novo":"BJ",
  "Africa/Sao_Tome":"ST","Africa/Tripoli":"LY","Africa/Tunis":"TN",
  "Africa/Windhoek":"NA",
  // America
  "America/Adak":"US","America/Anchorage":"US","America/Anguilla":"AI",
  "America/Antigua":"AG","America/Araguaina":"BR","America/Argentina/Buenos_Aires":"AR",
  "America/Argentina/Catamarca":"AR","America/Argentina/Cordoba":"AR",
  "America/Argentina/Jujuy":"AR","America/Argentina/La_Rioja":"AR",
  "America/Argentina/Mendoza":"AR","America/Argentina/Rio_Gallegos":"AR",
  "America/Argentina/Salta":"AR","America/Argentina/San_Juan":"AR",
  "America/Argentina/San_Luis":"AR","America/Argentina/Tucuman":"AR",
  "America/Argentina/Ushuaia":"AR","America/Aruba":"AW","America/Asuncion":"PY",
  "America/Atikokan":"CA","America/Bahia":"BR","America/Bahia_Banderas":"MX",
  "America/Barbados":"BB","America/Belem":"BR","America/Belize":"BZ",
  "America/Blanc-Sablon":"CA","America/Boa_Vista":"BR","America/Bogota":"CO",
  "America/Boise":"US","America/Cambridge_Bay":"CA","America/Campo_Grande":"BR",
  "America/Cancun":"MX","America/Caracas":"VE","America/Cayenne":"GF",
  "America/Cayman":"KY","America/Chicago":"US","America/Chihuahua":"MX",
  "America/Costa_Rica":"CR","America/Creston":"CA","America/Cuiaba":"BR",
  "America/Curacao":"CW","America/Danmarkshavn":"GL","America/Dawson":"CA",
  "America/Dawson_Creek":"CA","America/Denver":"US","America/Detroit":"US",
  "America/Dominica":"DM","America/Edmonton":"CA","America/Eirunepe":"BR",
  "America/El_Salvador":"SV","America/Fortaleza":"BR","America/Glace_Bay":"CA",
  "America/Godthab":"GL","America/Goose_Bay":"CA","America/Grand_Turk":"TC",
  "America/Grenada":"GD","America/Guadeloupe":"GP","America/Guatemala":"GT",
  "America/Guayaquil":"EC","America/Guyana":"GY","America/Halifax":"CA",
  "America/Havana":"CU","America/Hermosillo":"MX",
  "America/Indiana/Indianapolis":"US","America/Inuvik":"CA","America/Iqaluit":"CA",
  "America/Jamaica":"JM","America/Juneau":"US","America/Kentucky/Louisville":"US",
  "America/Kralendijk":"BQ","America/La_Paz":"BO","America/Lima":"PE",
  "America/Los_Angeles":"US","America/Lower_Princes":"SX","America/Maceio":"BR",
  "America/Managua":"NI","America/Manaus":"BR","America/Marigot":"MF",
  "America/Martinique":"MQ","America/Matamoros":"MX","America/Mazatlan":"MX",
  "America/Menominee":"US","America/Merida":"MX","America/Metlakatla":"US",
  "America/Mexico_City":"MX","America/Miquelon":"PM","America/Moncton":"CA",
  "America/Monterrey":"MX","America/Montevideo":"UY","America/Montserrat":"MS",
  "America/Nassau":"BS","America/New_York":"US","America/Nipigon":"CA",
  "America/Nome":"US","America/Noronha":"BR","America/Ojinaga":"MX",
  "America/Panama":"PA","America/Pangnirtung":"CA","America/Paramaribo":"SR",
  "America/Phoenix":"US","America/Port-au-Prince":"HT","America/Port_of_Spain":"TT",
  "America/Porto_Velho":"BR","America/Puerto_Rico":"PR","America/Rainy_River":"CA",
  "America/Rankin_Inlet":"CA","America/Recife":"BR","America/Regina":"CA",
  "America/Resolute":"CA","America/Rio_Branco":"BR","America/Santa_Isabel":"MX",
  "America/Santarem":"BR","America/Santiago":"CL","America/Santo_Domingo":"DO",
  "America/Sao_Paulo":"BR","America/Scoresbysund":"GL","America/Sitka":"US",
  "America/St_Barthelemy":"BL","America/St_Johns":"CA","America/St_Kitts":"KN",
  "America/St_Lucia":"LC","America/St_Thomas":"VI","America/St_Vincent":"VC",
  "America/Swift_Current":"CA","America/Tegucigalpa":"HN","America/Thule":"GL",
  "America/Thunder_Bay":"CA","America/Tijuana":"MX","America/Toronto":"CA",
  "America/Tortola":"VG","America/Vancouver":"CA","America/Whitehorse":"CA",
  "America/Winnipeg":"CA","America/Yakutat":"US","America/Yellowknife":"CA",
  // Asia
  "Asia/Aden":"YE","Asia/Almaty":"KZ","Asia/Amman":"JO","Asia/Anadyr":"RU",
  "Asia/Aqtau":"KZ","Asia/Aqtobe":"KZ","Asia/Ashgabat":"TM","Asia/Baghdad":"IQ",
  "Asia/Bahrain":"BH","Asia/Baku":"AZ","Asia/Bangkok":"TH","Asia/Beirut":"LB",
  "Asia/Bishkek":"KG","Asia/Brunei":"BN","Asia/Choibalsan":"MN","Asia/Chongqing":"CN",
  "Asia/Colombo":"LK","Asia/Damascus":"SY","Asia/Dhaka":"BD","Asia/Dili":"TL",
  "Asia/Dubai":"AE","Asia/Dushanbe":"TJ","Asia/Gaza":"PS","Asia/Harbin":"CN",
  "Asia/Hebron":"PS","Asia/Ho_Chi_Minh":"VN","Asia/Hong_Kong":"HK","Asia/Hovd":"MN",
  "Asia/Irkutsk":"RU","Asia/Jakarta":"ID","Asia/Jayapura":"ID","Asia/Jerusalem":"IL",
  "Asia/Kabul":"AF","Asia/Kamchatka":"RU","Asia/Karachi":"PK","Asia/Kashgar":"CN",
  "Asia/Kathmandu":"NP","Asia/Khandyga":"RU","Asia/Kolkata":"IN","Asia/Krasnoyarsk":"RU",
  "Asia/Kuala_Lumpur":"MY","Asia/Kuching":"MY","Asia/Kuwait":"KW","Asia/Macau":"MO",
  "Asia/Magadan":"RU","Asia/Makassar":"ID","Asia/Manila":"PH","Asia/Muscat":"OM",
  "Asia/Nicosia":"CY","Asia/Novokuznetsk":"RU","Asia/Novosibirsk":"RU","Asia/Omsk":"RU",
  "Asia/Oral":"KZ","Asia/Phnom_Penh":"KH","Asia/Pontianak":"ID","Asia/Pyongyang":"KP",
  "Asia/Qatar":"QA","Asia/Qyzylorda":"KZ","Asia/Rangoon":"MM","Asia/Riyadh":"SA",
  "Asia/Sakhalin":"RU","Asia/Samarkand":"UZ","Asia/Seoul":"KR","Asia/Shanghai":"CN",
  "Asia/Singapore":"SG","Asia/Taipei":"TW","Asia/Tashkent":"UZ","Asia/Tbilisi":"GE",
  "Asia/Tehran":"IR","Asia/Thimphu":"BT","Asia/Tokyo":"JP","Asia/Ulaanbaatar":"MN",
  "Asia/Urumqi":"CN","Asia/Ust-Nera":"RU","Asia/Vientiane":"LA","Asia/Vladivostok":"RU",
  "Asia/Yakutsk":"RU","Asia/Yekaterinburg":"RU","Asia/Yerevan":"AM",
  // Atlantic
  "Atlantic/Azores":"PT","Atlantic/Bermuda":"BM","Atlantic/Canary":"ES",
  "Atlantic/Cape_Verde":"CV","Atlantic/Faroe":"FO","Atlantic/Madeira":"PT",
  "Atlantic/Reykjavik":"IS","Atlantic/South_Georgia":"GS","Atlantic/St_Helena":"SH",
  "Atlantic/Stanley":"FK",
  // Australia
  "Australia/Adelaide":"AU","Australia/Brisbane":"AU","Australia/Broken_Hill":"AU",
  "Australia/Currie":"AU","Australia/Darwin":"AU","Australia/Eucla":"AU",
  "Australia/Hobart":"AU","Australia/Lindeman":"AU","Australia/Lord_Howe":"AU",
  "Australia/Melbourne":"AU","Australia/Perth":"AU","Australia/Sydney":"AU",
  // Europe
  "Europe/Amsterdam":"NL","Europe/Andorra":"AD","Europe/Athens":"GR",
  "Europe/Belgrade":"RS","Europe/Berlin":"DE","Europe/Bratislava":"SK",
  "Europe/Brussels":"BE","Europe/Bucharest":"RO","Europe/Budapest":"HU",
  "Europe/Busingen":"DE","Europe/Chisinau":"MD","Europe/Copenhagen":"DK",
  "Europe/Dublin":"IE","Europe/Gibraltar":"GI","Europe/Guernsey":"GG",
  "Europe/Helsinki":"FI","Europe/Isle_of_Man":"IM","Europe/Istanbul":"TR",
  "Europe/Jersey":"JE","Europe/Kaliningrad":"RU","Europe/Kiev":"UA",
  "Europe/Lisbon":"PT","Europe/Ljubljana":"SI","Europe/London":"GB",
  "Europe/Luxembourg":"LU","Europe/Madrid":"ES","Europe/Malta":"MT",
  "Europe/Mariehamn":"AX","Europe/Minsk":"BY","Europe/Monaco":"MC",
  "Europe/Moscow":"RU","Europe/Nicosia":"CY","Europe/Oslo":"NO",
  "Europe/Paris":"FR","Europe/Podgorica":"ME","Europe/Prague":"CZ",
  "Europe/Riga":"LV","Europe/Rome":"IT","Europe/Samara":"RU",
  "Europe/San_Marino":"SM","Europe/Sarajevo":"BA","Europe/Simferopol":"UA",
  "Europe/Skopje":"MK","Europe/Sofia":"BG","Europe/Stockholm":"SE",
  "Europe/Tallinn":"EE","Europe/Tirane":"AL","Europe/Uzhgorod":"UA",
  "Europe/Vaduz":"LI","Europe/Vatican":"VA","Europe/Vienna":"AT",
  "Europe/Vilnius":"LT","Europe/Volgograd":"RU","Europe/Warsaw":"PL",
  "Europe/Zagreb":"HR","Europe/Zaporozhye":"UA","Europe/Zurich":"CH",
  // Indian
  "Indian/Antananarivo":"MG","Indian/Chagos":"IO","Indian/Christmas":"CX",
  "Indian/Cocos":"CC","Indian/Comoro":"KM","Indian/Kerguelen":"TF",
  "Indian/Mahe":"SC","Indian/Maldives":"MV","Indian/Mauritius":"MU",
  "Indian/Mayotte":"YT","Indian/Reunion":"RE",
  // Pacific
  "Pacific/Apia":"WS","Pacific/Auckland":"NZ","Pacific/Chatham":"NZ",
  "Pacific/Chuuk":"FM","Pacific/Easter":"CL","Pacific/Efate":"VU",
  "Pacific/Enderbury":"KI","Pacific/Fakaofo":"TK","Pacific/Fiji":"FJ",
  "Pacific/Funafuti":"TV","Pacific/Galapagos":"EC","Pacific/Gambier":"PF",
  "Pacific/Guadalcanal":"SB","Pacific/Guam":"GU","Pacific/Honolulu":"US",
  "Pacific/Johnston":"US","Pacific/Kiritimati":"KI","Pacific/Kosrae":"FM",
  "Pacific/Kwajalein":"MH","Pacific/Majuro":"MH","Pacific/Marquesas":"PF",
  "Pacific/Midway":"UM","Pacific/Nauru":"NR","Pacific/Niue":"NU",
  "Pacific/Norfolk":"NF","Pacific/Noumea":"NC","Pacific/Pago_Pago":"AS",
  "Pacific/Palau":"PW","Pacific/Pitcairn":"PN","Pacific/Pohnpei":"FM",
  "Pacific/Port_Moresby":"PG","Pacific/Rarotonga":"CK","Pacific/Saipan":"MP",
  "Pacific/Tahiti":"PF","Pacific/Tarawa":"KI","Pacific/Tongatapu":"TO",
  "Pacific/Wake":"UM","Pacific/Wallis":"WF",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Signal collectors ───────────────────────────────────────────────────────

async function getTimezoneSignal() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryCode = TZ_COUNTRY[tz] || null;
    return {
      source: "timezone",
      available: !!countryCode,
      tz,
      countryCode,
      error: countryCode ? null : `Cannot map timezone "${tz}" to a country`,
    };
  } catch (err) {
    return { source: "timezone", available: false, error: err.message };
  }
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

async function getGPSSignal() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ source: "gps", available: false, error: "Geolocation API not supported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          source: "gps",
          available: true,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        const msgs = { 1: "GPS permission denied by user", 2: "Position unavailable", 3: "GPS timed out" };
        resolve({
          source: "gps",
          available: false,
          denied: err.code === 1,
          error: msgs[err.code] || err.message,
        });
      },
      { timeout: 15000, maximumAge: 60000, enableHighAccuracy: true }
    );
  });
}

// ─── Consensus ───────────────────────────────────────────────────────────────

function evaluate({ tzSignal, ipSignal, gpsSignal, strict }) {
  const agreements = [];
  const conflicts  = [];
  const notes      = [];
  let gpsIpKm      = null;

  // ① Timezone country ↔ IP country
  if (tzSignal.available && ipSignal.available) {
    if (tzSignal.countryCode === ipSignal.countryCode) {
      agreements.push(`Timezone (${tzSignal.countryCode}) matches IP country`);
    } else {
      conflicts.push(`Timezone says ${tzSignal.countryCode}, IP says ${ipSignal.countryCode}`);
    }
  }

  // ② Timezone string ↔ IP timezone (bonus note, not a separate verdict)
  if (tzSignal.available && ipSignal.available && ipSignal.timezone) {
    if (tzSignal.tz === ipSignal.timezone) {
      notes.push(`Timezone string exact match: "${tzSignal.tz}"`);
    }
  }

  // ③ GPS coordinates ↔ IP coordinates
  if (gpsSignal.available && ipSignal.available) {
    gpsIpKm = haversineKm(gpsSignal.lat, gpsSignal.lon, ipSignal.lat, ipSignal.lon);
    if (gpsIpKm <= COORD_TOLERANCE_KM) {
      agreements.push(`GPS & IP within ${Math.round(gpsIpKm)} km of each other`);
    } else {
      conflicts.push(`GPS & IP are ${Math.round(gpsIpKm)} km apart (limit: ${COORD_TOLERANCE_KM} km)`);
    }
  }

  // ④ Triple agreement note
  if (
    gpsSignal.available && ipSignal.available && tzSignal.available &&
    gpsIpKm !== null && gpsIpKm <= COORD_TOLERANCE_KM &&
    tzSignal.countryCode === ipSignal.countryCode
  ) {
    notes.push("Triple signal agreement: GPS + IP + timezone all consistent");
  }

  const availableCount = [tzSignal, ipSignal, gpsSignal].filter((s) => s.available).length;

  let granted;
  if (availableCount === 0) {
    granted = false;
  } else if (strict) {
    granted = conflicts.length === 0 && agreements.length > 0;
  } else {
    granted = agreements.length >= 1 && conflicts.length === 0;
  }

  return {
    granted,
    agreements,
    conflicts,
    notes,
    gpsIpKm,
    availableCount,
    summary: granted
      ? `Access granted — ${agreements.length} signal(s) in agreement`
      : availableCount === 0
      ? "Access denied — no signals could be collected"
      : `Access denied — ${conflicts.length} conflict(s) detected`,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useLocationVerify({ strict = false } = {}) {
  const [status, setStatus]   = useState("idle"); // idle | loading | granted | denied | error
  const [details, setDetails] = useState(null);

  const verify = useCallback(async () => {
    setStatus("loading");
    setDetails(null);

    try {
      const [tzSignal, ipSignal, gpsSignal] = await Promise.all([
        getTimezoneSignal(),
        getIPSignal(),
        getGPSSignal(),
      ]);

      const result = evaluate({ tzSignal, ipSignal, gpsSignal, strict });
      setDetails({ timezone: tzSignal, ip: ipSignal, gps: gpsSignal, ...result });
      setStatus(result.granted ? "granted" : "denied");
    } catch (err) {
      setDetails({ error: err.message });
      setStatus("error");
    }
  }, [strict]);

  return { status, details, verify };
}
