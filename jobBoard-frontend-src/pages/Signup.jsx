import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as api from "../api";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("freelancer");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.signup({ name, email, password, role });
      navigate("/login", { state: { justSignedUp: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1 style={{ marginTop: 48 }}>Create an account</h1>
      <p className="muted" style={{ marginBottom: 32 }}>
        Post work or apply to it — pick a role below.
      </p>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 420 }}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="role">I am a</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="freelancer">Freelancer — looking for work</option>
            <option value="hirer">Hirer — posting jobs</option>
          </select>
        </div>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Creating..." : "Create account"}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 20 }}>
        Already have an account? <Link to="/login" style={{ color: "var(--accent)" }}>Log in</Link>
      </p>
    </div>
  );
}
