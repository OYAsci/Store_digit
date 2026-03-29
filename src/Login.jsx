import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { detectAndApplyLanguageFromIP } from "./ipLanguage";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    detectAndApplyLanguageFromIP();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    navigate("/");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "40px auto" }}>
      <h1 style={{ textAlign: "center" }}>{t("adminLogin")}</h1>

      <form
        onSubmit={handleLogin}
        style={{ display: "grid", gap: "12px", marginTop: "20px" }}
      >
        <input
          name="email"
          type="email"
          placeholder={t("email")}
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder={t("password")}
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit">{t("login")}</button>
      </form>

      {errorMsg && (
        <p style={{ color: "red", marginTop: "16px" }}>{errorMsg}</p>
      )}
    </div>
  );
}

export default Login;
