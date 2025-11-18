import { useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AuthForm() {
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", organizationName: "", department: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
    if (mode === "login") {
        if (!form.email || !form.password) {
          setError("Please fill in all fields");
          setLoading(false);
          return;
        }
        const data = await apiFetch("/auth/login", { 
          method: "POST", 
          body: { email: form.email, password: form.password } 
        });
      login(data);
    } else {
        // Register
        if (!form.name || !form.email || !form.password || !form.organizationName) {
          setError("Please fill in all required fields");
          setLoading(false);
          return;
        }
        const data = await apiFetch("/auth/register", { 
          method: "POST", 
          body: { 
            name: form.name,
            email: form.email, 
            password: form.password,
            organizationName: form.organizationName,
            department: form.department || undefined
          } 
        });
        login(data);
      }
    } catch (err) {
      let errorMessage = err.message || "An error occurred. Please try again.";
      
      // Provide helpful error messages
      if (errorMessage.includes("Cannot connect to server") || errorMessage.includes("Failed to fetch")) {
        errorMessage = "Cannot connect to the server. Please make sure the backend is running. Start it with: cd backend && npm run dev";
      }
      
      setError(errorMessage);
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="auth">
      <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
      {error && <div className="error">{error}</div>}
      {mode === "register" && (
        <>
          <input 
            placeholder="Full name *" 
            value={form.name} 
            onChange={e => update("name", e.target.value)}
            required
            disabled={loading}
          />
          <input 
            placeholder="Organization name *" 
            value={form.organizationName} 
            onChange={e => update("organizationName", e.target.value)}
            required
            disabled={loading}
          />
          <input 
            placeholder="Department (optional)" 
            value={form.department} 
            onChange={e => update("department", e.target.value)}
            disabled={loading}
          />
        </>
      )}
      <input 
        type="email" 
        placeholder="Email address *" 
        value={form.email} 
        onChange={e => update("email", e.target.value)}
        required
        disabled={loading}
      />
      <input 
        type="password" 
        placeholder="Password *" 
        value={form.password} 
        onChange={e => update("password", e.target.value)}
        required
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Loading..." : mode === "login" ? "Sign in" : "Create account"}
      </button>
      <button 
        type="button" 
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError("");
        }}
        disabled={loading}
      >
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}