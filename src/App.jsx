import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function App() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [session, setSession] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    link: "",
    category_id: "",
  });

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        categories(name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
      return;
    }

    setProducts(data || []);
    setErrorMsg("");
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setCategories(data || []);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSession(null);
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!session?.user) {
      setErrorMsg("You must be logged in to add products.");
      return;
    }

    if (!imageFile) {
      setErrorMsg("Please select an image.");
      return;
    }

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(fileName, imageFile);

    if (uploadError) {
      console.error(uploadError);
      setErrorMsg(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("products")
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    const { error } = await supabase.from("products").insert([
      {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        image_url: imageUrl,
        link: form.link,
        category_id: form.category_id,
        user_id: session.user.id,
      },
    ]);

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
      return;
    }

    setForm({
      name: "",
      description: "",
      price: "",
      link: "",
      category_id: "",
    });

    setImageFile(null);
    fetchProducts();
  };

  const handleProductClick = (product) => {
    if (product.link) {
      window.open(product.link, "_blank");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        {!session ? (
          <button
            onClick={() => navigate("/login")}
            title="Login"
            style={{
              fontSize: "22px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            👤
          </button>
        ) : (
          <>
            <span style={{ fontSize: "14px" }}>{session.user.email}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>

      <h1 style={{ textAlign: "center" }}>Store Digit</h1>

      {session && (
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ textAlign: "center" }}>Admin panel</h2>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: "12px",
              maxWidth: "700px",
              margin: "0 auto",
            }}
          >
            <input
              name="name"
              placeholder="Product name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              rows={4}
            />

            <input
              name="price"
              type="number"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              required
            />

            <input
              name="link"
              placeholder="Product link (https://...)"
              value={form.link}
              onChange={handleChange}
            />

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />

            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <button type="submit">Add Product</button>
          </form>
        </div>
      )}

      {errorMsg && (
        <p style={{ color: "red", textAlign: "center", marginBottom: "20px" }}>
          {errorMsg}
        </p>
      )}

      <hr />

      <h2 style={{ textAlign: "center" }}>Products</h2>

      <div style={{ display: "grid", gap: "20px" }}>
        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => handleProductClick(p)}
            style={{
              border: "1px solid #444",
              padding: "16px",
              borderRadius: "10px",
              cursor: p.link ? "pointer" : "default",
            }}
          >
            <img
              src={p.image_url || "https://via.placeholder.com/200"}
              alt={p.name}
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/200";
              }}
              style={{
                width: "200px",
                maxWidth: "100%",
                borderRadius: "8px",
                marginBottom: "10px",
                display: "block",
              }}
            />

            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <p>
              <strong>Price:</strong> {p.price} MAD
            </p>
            <p>
              <strong>Category:</strong> {p.categories?.name || "No category"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
