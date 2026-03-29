/**
 * LocationGate
 *
 * Wraps any content. Only renders children when location verification passes.
 * Shares the same CSS variables as App.jsx themes so it auto-adapts to the
 * active theme (zinc, ocean, forest, rose, night).
 *
 * Usage:
 *   import LocationGate from "./LocationGate";
 *
 *   // In main.jsx or directly in App.jsx render:
 *   <LocationGate>
 *     <YourApp />
 *   </LocationGate>
 *
 * Props:
 *   children {ReactNode} content to render when access is granted
 */

import { useLocationVerify } from "./useLocationVerify";

// ─── Styles ──────────────────────────────────────────────────────────────────

const css = `
  .lg-overlay {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg, #fafafa);
    font-family: 'Segoe UI', system-ui, sans-serif;
    padding: 24px;
    box-sizing: border-box;
  }

  .lg-card {
    background: var(--surface, #ffffff);
    border: 1.5px solid var(--border, #e4e4e7);
    border-radius: var(--radius, 12px);
    padding: 40px 32px 32px;
    max-width: 460px;
    width: 100%;
    text-align: center;
    box-sizing: border-box;
  }

  .lg-icon {
    font-size: 52px;
    line-height: 1;
    margin-bottom: 18px;
    display: block;
  }

  .lg-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text, #18181b);
    margin: 0 0 10px;
    letter-spacing: -0.3px;
  }

  .lg-sub {
    font-size: 14px;
    color: var(--text-muted, #71717a);
    line-height: 1.65;
    margin: 0 0 28px;
  }

  /* ── Primary button ── */
  .lg-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px 24px;
    border-radius: var(--radius, 10px);
    border: none;
    background: var(--accent, #3f3f46);
    color: var(--accent-text, #ffffff);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    box-sizing: border-box;
  }
  .lg-btn:hover:not(:disabled) { background: var(--accent-hover, #27272a); }
  .lg-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  /* ── Secondary button ── */
  .lg-btn-secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 10px 24px;
    border-radius: var(--radius, 10px);
    border: 1.5px solid var(--border, #e4e4e7);
    background: transparent;
    color: var(--text-muted, #71717a);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 10px;
    transition: background 0.15s;
    box-sizing: border-box;
  }
  .lg-btn-secondary:hover { background: var(--bg-secondary, #f4f4f5); }

  /* ── Signal rows ── */
  .lg-signals {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
    text-align: left;
  }

  .lg-signal-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 11px 14px;
    border-radius: calc(var(--radius, 10px) - 2px);
    border: 1px solid var(--border, #e4e4e7);
    background: var(--bg, #fafafa);
    box-sizing: border-box;
  }

  .lg-signal-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    flex-shrink: 0;
    font-size: 12px;
    margin-top: 1px;
  }
  .sig-ok   { background: #dcfce7; color: #15803d; }
  .sig-warn { background: #fef9c3; color: #92400e; }
  .sig-fail { background: #fee2e2; color: #b91c1c; }
  .sig-skip { background: var(--bg-secondary, #f4f4f5); color: var(--text-muted, #71717a); }

  .lg-signal-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text, #18181b);
    margin-bottom: 2px;
  }

  .lg-signal-value {
    font-size: 12px;
    color: var(--text-muted, #71717a);
    line-height: 1.5;
    word-break: break-word;
  }

  /* ── Verdict banner ── */
  .lg-verdict {
    padding: 11px 16px;
    border-radius: calc(var(--radius, 10px) - 2px);
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 20px;
    text-align: left;
    line-height: 1.5;
  }
  .lg-verdict-ok   { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .lg-verdict-fail { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }

  /* ── Agreement / conflict list ── */
  .lg-detail-list {
    font-size: 12px;
    color: var(--text-muted, #71717a);
    text-align: left;
    line-height: 1.8;
    margin-bottom: 20px;
    padding: 0 2px;
  }

  /* ── Loading spinner ── */
  .lg-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border, #e4e4e7);
    border-top-color: var(--accent, #3f3f46);
    border-radius: 50%;
    animation: lg-spin 0.8s linear infinite;
    margin: 0 auto 20px;
  }
  @keyframes lg-spin { to { transform: rotate(360deg); } }

  /* ── Divider ── */
  .lg-divider {
    border: none;
    border-top: 1px solid var(--border, #e4e4e7);
    margin: 20px 0;
  }

  @media (max-width: 480px) {
    .lg-card { padding: 28px 18px 24px; }
    .lg-title { font-size: 19px; }
  }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SignalRow({ emoji, label, signal }) {
  if (!signal) return null;

  let indicatorClass = "sig-skip";
  let indicatorIcon  = "–";
  let value          = "Not checked";

  if (signal.available === false) {
    indicatorClass = signal.denied ? "sig-warn" : "sig-fail";
    indicatorIcon  = signal.denied ? "!" : "✕";
    value          = signal.error || "Unavailable";
  } else if (signal.available === true) {
    indicatorClass = "sig-ok";
    indicatorIcon  = "✓";
    if (signal.source === "ip") {
      value = `${signal.city}, ${signal.country} (${signal.countryCode})  ·  ${signal.ip}`;
    }
  }

  return (
    <div className="lg-signal-row">
      <div className={`lg-signal-indicator ${indicatorClass}`}>{indicatorIcon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lg-signal-label">{emoji} {label}</div>
        <div className="lg-signal-value">{value}</div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LocationGate({ children }) {
  const { status, details, verify } = useLocationVerify();

  // ── Granted: transparent pass-through ──────────────────────────────────────
  if (status === "granted") return <>{children}</>;

  // ── Shared style injection ─────────────────────────────────────────────────
  const styleTag = <style>{css}</style>;

  // ── Idle ───────────────────────────────────────────────────────────────────
  if (status === "idle") {
    return (
      <>
        {styleTag}
        <div className="lg-overlay">
          <div className="lg-card">
            <span className="lg-icon">🌍</span>
            <h1 className="lg-title">Location Verification</h1>
            <p className="lg-sub">
              Before you continue, we verify your location using your IP
              address only. Your language will be selected automatically based
              on the detected IP country.
            </p>
            <div className="lg-signals">
              <div className="lg-signal-row">
                <div className="lg-signal-indicator sig-skip">–</div>
                <div>
                  <div className="lg-signal-label">🌐 IP Geolocation</div>
                  <div className="lg-signal-value">Looked up from your network address — no permission needed</div>
                </div>
              </div>
            </div>
            <button className="lg-btn" onClick={verify}>
              Start Verification
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <>
        {styleTag}
        <div className="lg-overlay">
          <div className="lg-card">
            <div className="lg-spinner" />
            <h1 className="lg-title">Verifying your location…</h1>
            <p className="lg-sub">
              Checking your IP geolocation and applying language preferences.
            </p>
            <div className="lg-signals">
              <div className="lg-signal-row">
                <div className="lg-signal-indicator sig-skip" style={{ animation: "lg-spin 1.2s linear infinite" }}>◌</div>
                <div><div className="lg-signal-label">🌐 IP Geolocation</div></div>
              </div>
            </div>
            <button className="lg-btn" disabled>Checking…</button>
          </div>
        </div>
      </>
    );
  }

  // ── Hard error ─────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <>
        {styleTag}
        <div className="lg-overlay">
          <div className="lg-card">
            <span className="lg-icon">⚠️</span>
            <h1 className="lg-title">Verification Error</h1>
            <p className="lg-sub">{details?.error || "An unexpected error occurred during verification."}</p>
            <button className="lg-btn" onClick={verify}>Try Again</button>
          </div>
        </div>
      </>
    );
  }

  // ── Denied ─────────────────────────────────────────────────────────────────
  return (
    <>
      {styleTag}
      <div className="lg-overlay">
        <div className="lg-card">
          <span className="lg-icon">🚫</span>
          <h1 className="lg-title">Access Denied</h1>

          <div className={`lg-verdict ${details?.granted ? "lg-verdict-ok" : "lg-verdict-fail"}`}>
            {details?.summary}
          </div>

          <div className="lg-signals">
            <SignalRow emoji="🌐" label="IP Geolocation" signal={details?.ip} />
          </div>

          {(details?.agreements?.length > 0 || details?.conflicts?.length > 0 || details?.notes?.length > 0) && (
            <div className="lg-detail-list">
              {details.agreements.map((a, i) => <div key={i}>✅ {a}</div>)}
              {details.conflicts.map((c, i)  => <div key={i}>❌ {c}</div>)}
              {details.notes.map((n, i)      => <div key={i}>ℹ️ {n}</div>)}
            </div>
          )}

          <hr className="lg-divider" />

          <button className="lg-btn" onClick={verify}>
            Retry Verification
          </button>
          <button className="lg-btn-secondary" onClick={verify}>
            Try on a different network
          </button>
        </div>
      </div>
    </>
  );
}
