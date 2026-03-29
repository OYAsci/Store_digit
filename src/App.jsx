import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import LanguageSwitcher from "./LanguageSwitcher";

const THEMES = {
  zinc: {
    label: "Zinc",
    "--bg": "#fafafa",
    "--bg-secondary": "#f4f4f5",
    "--surface": "#ffffff",
    "--border": "#e4e4e7",
    "--text": "#18181b",
    "--text-muted": "#71717a",
    "--accent": "#3f3f46",
    "--accent-text": "#ffffff",
    "--accent-hover": "#27272a",
    "--danger": "#dc2626",
    "--danger-hover": "#b91c1c",
    "--radius": "10px",
  },
  ocean: {
    label: "Ocean",
    "--bg": "#f0f9ff",
    "--bg-secondary": "#e0f2fe",
    "--surface": "#ffffff",
    "--border": "#bae6fd",
    "--text": "#0c4a6e",
    "--text-muted": "#0369a1",
    "--accent": "#0284c7",
    "--accent-text": "#ffffff",
    "--accent-hover": "#0369a1",
    "--danger": "#dc2626",
    "--danger-hover": "#b91c1c",
    "--radius": "12px",
  },
  forest: {
    label: "Forest",
    "--bg": "#f0fdf4",
    "--bg-secondary": "#dcfce7",
    "--surface": "#ffffff",
    "--border": "#bbf7d0",
    "--text": "#14532d",
    "--text-muted": "#15803d",
    "--accent": "#16a34a",
    "--accent-text": "#ffffff",
    "--accent-hover": "#15803d",
    "--danger": "#dc2626",
    "--danger-hover": "#b91c1c",
    "--radius": "8px",
  },
  rose: {
    label: "Rose",
    "--bg": "#fff1f2",
    "--bg-secondary": "#ffe4e6",
    "--surface": "#ffffff",
    "--border": "#fecdd3",
    "--text": "#881337",
    "--text-muted": "#be123c",
    "--accent": "#e11d48",
    "--accent-text": "#ffffff",
    "--accent-hover": "#be123c",
    "--danger": "#7c3aed",
    "--danger-hover": "#6d28d9",
    "--radius": "16px",
  },
  night: {
    label: "Night",
    "--bg": "#09090b",
    "--bg-secondary": "#18181b",
    "--surface": "#27272a",
    "--border": "#3f3f46",
    "--text": "#fafafa",
    "--text-muted": "#a1a1aa",
    "--accent": "#a78bfa",
    "--accent-text": "#09090b",
    "--accent-hover": "#c4b5fd",
    "--danger": "#f87171",
    "--danger-hover": "#fca5a5",
    "--radius": "10px",
  },
};

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .store-root {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Segoe UI', system-ui, sans-serif;
    transition: background 0.25s, color 0.25s;
  }

  .store-inner {
    max-width: 960px;
    margin: 0 auto;
    padding: 20px 16px 60px;
  }

  /* ── Header ── */
  .store-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 24px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .theme-picker {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .theme-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2.5px solid transparent;
    cursor: pointer;
    transition: transform 0.15s, border-color 0.15s;
    outline: none;
  }
  .theme-dot:hover { transform: scale(1.15); }
  .theme-dot.active { border-color: var(--text); transform: scale(1.15); }

  .theme-dot-zinc  { background: #3f3f46; }
  .theme-dot-ocean { background: #0284c7; }
  .theme-dot-forest{ background: #16a34a; }
  .theme-dot-rose  { background: #e11d48; }
  .theme-dot-night { background: #a78bfa; border: 2.5px solid #3f3f46; }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* ── Buttons ── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .btn:hover { background: var(--bg-secondary); border-color: var(--accent); }

  .btn-accent {
    background: var(--accent);
    color: var(--accent-text);
    border-color: var(--accent);
  }
  .btn-accent:hover { background: var(--accent-hover); border-color: var(--accent-hover); }

  .btn-danger {
    background: transparent;
    color: var(--danger);
    border-color: var(--danger);
    font-size: 13px;
    padding: 6px 12px;
  }
  .btn-danger:hover { background: var(--danger); color: #fff; }
  .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-icon {
    font-size: 22px;
    padding: 6px 10px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    border-radius: var(--radius);
  }
  .btn-icon:hover { background: var(--bg-secondary); }

  /* ── Title ── */
  .store-title {
    text-align: center;
    font-size: clamp(22px, 5vw, 36px);
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--text);
    margin-bottom: 32px;
  }

  /* ── Admin Panel ── */
  .admin-panel {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    margin-bottom: 36px;
  }

  .admin-panel h2 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 20px;
  }

  .form-grid {
    display: grid;
    gap: 12px;
  }

  .form-grid input,
  .form-grid textarea,
  .form-grid select {
    width: 100%;
    padding: 10px 14px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.15s;
    outline: none;
  }
  .form-grid input:focus,
  .form-grid textarea:focus,
  .form-grid select:focus {
    border-color: var(--accent);
  }
  .form-grid select option {
    background: var(--surface);
    color: var(--text);
  }

  /* ── Error ── */
  .error-msg {
    color: var(--danger);
    text-align: center;
    font-size: 14px;
    margin-bottom: 20px;
    padding: 10px 16px;
    border: 1px solid var(--danger);
    border-radius: var(--radius);
    background: var(--bg-secondary);
  }

  /* ── Divider ── */
  .divider {
    border: none;
    border-top: 1.5px solid var(--border);
    margin: 8px 0 28px;
  }

  .section-title {
    text-align: center;
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 24px;
    color: var(--text);
  }

  /* ── Product Grid ── */
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }

  @media (max-width: 480px) {
    .product-grid {
      grid-template-columns: 1fr;
    }
  }

  .product-card {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    transition: border-color 0.2s, transform 0.2s;
    display: flex;
    flex-direction: column;
  }
  .product-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }

  .product-img-wrap {
    width: 100%;
    aspect-ratio: 4/3;
    overflow: hidden;
    background: var(--bg-secondary);
    cursor: pointer;
  }

  .product-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
    display: block;
  }
  .product-img-wrap:hover img { transform: scale(1.04); }

  .product-body {
    padding: 14px 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .product-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
  }
  .product-name:hover { color: var(--accent); }

  .product-desc {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
    flex: 1;
  }

  .product-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    flex-wrap: wrap;
    gap: 6px;
  }

  .product-price {
    font-size: 16px;
    font-weight: 700;
    color: var(--accent);
  }

  .product-category {
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--bg-secondary);
    color: var(--text-muted);
    border: 1px solid var(--border);
  }

  .product-footer {
    padding: 10px 16px 14px;
    border-top: 1px solid var(--border);
  }

  /* ── User email chip ── */
  .user-chip {
    font-size: 13px;
    color: var(--text-muted);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 4px 12px;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 600px) {
    .store-inner { padding: 14px 12px 40px; }
    .admin-panel { padding: 16px; }
    .store-header { gap: 8px; }
    .user-chip { max-width: 130px; }
  }
`;

function ThemePicker({ current, onChange }) {
  return (
    <div className="theme-picker" aria-label="Choose theme">
      {Object.entries(THEMES).map(([key, t]) => (
        <button
          key={key}
          className={`theme-dot theme-dot-${key} ${current === key ? "active" : ""}`}
          title={t.label}
          aria-pressed={current === key}
          onClick={() => onChange(key)}
        />
      ))}
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [session, setSession] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("store-theme") || "zinc");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    link: "",
    category_id: "",
  });

  // Apply CSS variables whenever theme changes
  useEffect(() => {
    const vars = THEMES[theme] || THEMES.zinc;
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, val]) => {
      if (key.startsWith("--")) root.style.setProperty(key, val);
    });
    localStorage.setItem("store-theme", theme);
  }, [theme]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); setErrorMsg(error.message); return; }
    setProducts(data || []);
    setErrorMsg("");
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });
    if (error) { console.error(error); return; }
    setCategories(data || []);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s || null));
    return () => subscription.unsubscribe();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setImageFile(e.target.files?.[0] || null);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { setErrorMsg(error.message); return; }
    setSession(null);
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!session?.user) { setErrorMsg(t("loginRequiredAdd")); return; }
    if (!imageFile) { setErrorMsg(t("pleaseSelectImage")); return; }

    const fileExt = imageFile.name.split(".").pop();
    const filePath = `${session.user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("products").upload(filePath, imageFile);
    if (uploadError) { console.error(uploadError); setErrorMsg(uploadError.message); return; }

    const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(filePath);
    const imageUrl = publicUrlData.publicUrl;

    const { error } = await supabase.from("products").insert([{
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      image_url: imageUrl,
      storage_path: filePath,
      link: form.link,
      category_id: form.category_id,
      user_id: session.user.id,
    }]);

    if (error) {
      console.error(error);
      await supabase.storage.from("products").remove([filePath]);
      setErrorMsg(error.message);
      return;
    }

    setForm({ name: "", description: "", price: "", link: "", category_id: "" });
    setImageFile(null);
    fetchProducts();
  };

  const handleDeleteProduct = async (product) => {
    if (!session?.user) { setErrorMsg(t("loginRequiredDelete")); return; }
    if (!window.confirm(t("deleteConfirm", { name: product.name }))) return;

    setDeletingId(product.id);
    setErrorMsg("");

    try {
      if (product.storage_path) {
        const { error: storageError } = await supabase.storage.from("products").remove([product.storage_path]);
        if (storageError) throw storageError;
      }
      const { error: deleteError } = await supabase.from("products").delete().eq("id", product.id);
      if (deleteError) throw deleteError;
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setErrorMsg(err.message || t("deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleProductClick = (product) => {
    if (product.link) window.open(product.link, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <style>{css}</style>
      <div className="store-root">
        <div className="store-inner">

          {/* Header */}
          <header className="store-header">
            <div className="header-left">
              <LanguageSwitcher />
              <ThemePicker current={theme} onChange={setTheme} />
            </div>
            <div className="header-right">
              {!session ? (
                <button className="btn-icon" onClick={() => navigate("/login")} title={t("login")}>👤</button>
              ) : (
                <>
                  <span className="user-chip">{session.user.email}</span>
                  <button className="btn" onClick={handleLogout}>{t("logout")}</button>
                </>
              )}
            </div>
          </header>

          <h1 className="store-title">{t("storeTitle")}</h1>

          {/* Admin Panel */}
          {session && (
            <div className="admin-panel">
              <h2>{t("adminPanel")}</h2>
              <form className="form-grid" onSubmit={handleSubmit}>
                <input name="name" placeholder={t("productName")} value={form.name} onChange={handleChange} required />
                <textarea name="description" placeholder={t("description")} value={form.description} onChange={handleChange} rows={3} />
                <input name="price" type="number" step="0.01" placeholder={t("price")} value={form.price} onChange={handleChange} required />
                <input name="link" placeholder={t("productLink")} value={form.link} onChange={handleChange} />
                <input type="file" accept="image/*" onChange={handleFileChange} required aria-label={t("selectImage")} />
                <select name="category_id" value={form.category_id} onChange={handleChange} required>
                  <option value="">{t("selectCategory")}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button type="submit" className="btn btn-accent">{t("addProduct")}</button>
              </form>
            </div>
          )}

          {errorMsg && <div className="error-msg">{errorMsg}</div>}

          <hr className="divider" />
          <h2 className="section-title">{t("products")}</h2>

          {/* Product Grid */}
          <div className="product-grid">
            {products.map((p) => (
              <div key={p.id} className="product-card">
                <div className="product-img-wrap" onClick={() => handleProductClick(p)}>
                  <img
                    src={p.image_url || "https://via.placeholder.com/400x300"}
                    alt={p.name}
                    onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/400x300"; }}
                  />
                </div>

                <div className="product-body">
                  <div className="product-name" onClick={() => handleProductClick(p)}>{p.name}</div>
                  {p.description && <div className="product-desc">{p.description}</div>}
                  <div className="product-meta">
                    <span className="product-price">{p.price} MAD</span>
                    <span className="product-category">{p.categories?.name || t("noCategory")}</span>
                  </div>
                </div>

                {session && (
                  <div className="product-footer">
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteProduct(p)}
                      disabled={deletingId === p.id}
                    >
                      {deletingId === p.id ? t("deleting") : t("delete")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}

export default App;
