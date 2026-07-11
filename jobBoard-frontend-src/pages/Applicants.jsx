import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as api from "../api";

export default function Applicants() {
  const { id } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .getApplicationsForPost(id)
      .then(setApplications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="page">
      <div className="hero" style={{ paddingTop: 48 }}>
        <p><Link to={`/posts/${id}`} className="muted">← Back to post</Link></p>
        <h1>Applicants</h1>
      </div>

      {error && <div className="error-box" style={{ marginTop: 24 }}>{error}</div>}
      {loading && <p className="muted mono" style={{ marginTop: 24 }}>Loading...</p>}
      {!loading && !error && applications.length === 0 && (
        <div className="empty">No applications yet.</div>
      )}

      {applications.map((app) => (
        <div key={app.id} className="card" style={{ marginTop: 16 }}>
          <div className="muted mono" style={{ fontSize: 12, marginBottom: 8 }}>
            Applicant #{app.user_id} · Applied {new Date(app.created_at).toLocaleDateString()}
          </div>
          <p style={{ whiteSpace: "pre-wrap" }}>{app.content}</p>
        </div>
      ))}
    </div>
  );
}
