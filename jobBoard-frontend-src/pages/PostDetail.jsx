import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as api from "../api";

export default function PostDetail() {
  const { id } = useParams();
  const { account } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingApplied, setCheckingApplied] = useState(false);

  const [coverLetter, setCoverLetter] = useState("");
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // No GET /posts/{id} on the backend yet, so we fetch the full list
  // and find this one. Fine for now, worth a dedicated route later.
  useEffect(() => {
    setLoading(true);
    api
      .getPosts()
      .then((posts) => {
        const found = posts.find((p) => String(p.id) === id);
        setPost(found || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!account || account.role !== "freelancer" || !post) return;
    setCheckingApplied(true);
    api
      .getMyApplications(account.id)
      .then((apps) => {
        setAlreadyApplied(apps.some((a) => a.post_id === post.id));
      })
      .catch(() => {})
      .finally(() => setCheckingApplied(false));
  }, [account, post]);

  async function handleApply(e) {
    e.preventDefault();
    setApplyError("");
    setSubmitting(true);
    try {
      await api.applyToPost({ post_id: post.id, content: coverLetter });
      setApplySuccess(true);
      setAlreadyApplied(true);
    } catch (err) {
      setApplyError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page"><p className="muted mono" style={{ marginTop: 48 }}>Loading...</p></div>;
  if (error) return <div className="page"><div className="error-box" style={{ marginTop: 48 }}>{error}</div></div>;
  if (!post) return <div className="page"><div className="empty" style={{ marginTop: 48 }}>Post not found.</div></div>;

  const expired = new Date(post.expiry_date) < new Date();
  const isOwner = account && account.role === "hirer" && account.id === post.author_id;

  return (
    <div className="page">
      <div className="hero" style={{ paddingTop: 48 }}>
        <p>Job #{String(post.id).padStart(3, "0")} · {expired ? "Closed" : "Open"}</p>
        <h1>{post.title}</h1>
        <p style={{ marginTop: 8 }}>Expires {new Date(post.expiry_date).toLocaleDateString()}</p>
      </div>

      <p style={{ whiteSpace: "pre-wrap", marginTop: 24 }}>{post.content}</p>

      {isOwner && (
        <div style={{ marginTop: 32, display: "flex", gap: 10 }}>
          <Link to={`/posts/${post.id}/applicants`} className="btn">
            View applicants
          </Link>
        </div>
      )}

      {!account && !expired && (
        <div className="info-box" style={{ marginTop: 32 }}>
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Log in</Link> as a freelancer to apply.
        </div>
      )}

      {account && account.role === "freelancer" && (
        <div style={{ marginTop: 32 }}>
          {expired ? (
            <div className="error-box">This post is no longer accepting applications.</div>
          ) : checkingApplied ? (
            <p className="muted mono">Checking application status...</p>
          ) : alreadyApplied ? (
            <div className="info-box">
              {applySuccess ? "Application submitted." : "You've already applied to this post."}
            </div>
          ) : (
            <form onSubmit={handleApply} className="card">
              <h3>Apply</h3>
              {applyError && <div className="error-box">{applyError}</div>}
              <div className="field">
                <label htmlFor="coverLetter">Cover letter</label>
                <textarea
                  id="coverLetter"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                  placeholder="Why you're a fit for this job..."
                />
              </div>
              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit application"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
