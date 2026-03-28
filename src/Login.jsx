import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
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
      <h1 style={{ textAlign: "center" }}>Admin Login</h1>

      <form
        onSubmit={handleLogin}
        style={{ display: "grid", gap: "12px", marginTop: "20px" }}
      >
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Login</button>
      </form>

      {errorMsg && (
        <p style={{ color: "red", marginTop: "16px" }}>{errorMsg}</p>
      )}
    </div>
  );
}

export default Login;
