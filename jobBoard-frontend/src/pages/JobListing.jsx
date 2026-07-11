import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as api from "../api";

function isExpired(post) {
  return new Date(post.expiry_date) < new Date();
}

export default function JobListing() {
  const { account } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadPosts() {
    setLoading(true);
    api
      .getPosts()
      .then((data) => setPosts(data.slice().reverse())) // newest first
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadPosts, []);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api.createPost({ title, content });
      setTitle("");
      setContent("");
      setShowForm(false);
      loadPosts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="hero">
        <p>Open positions</p>
        <h1>The board</h1>
      </div>

      {account?.role === "hirer" && (
        <div style={{ margin: "24px 0" }}>
          {!showForm ? (
            <button className="btn" onClick={() => setShowForm(true)}>
              + Create job post
            </button>
          ) : (
            <form onSubmit={handleCreate} className="card">
              {formError && <div className="error-box">{formError}</div>}
              <div className="field">
                <label htmlFor="title">Title</label>
                <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="content">Description</label>
                <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? "Posting..." : "Publish post"}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {error && <div className="error-box">{error}</div>}
      {loading && <p className="muted mono">Loading...</p>}

      {!loading && posts.length === 0 && (
        <div className="empty">No job posts yet.</div>
      )}

      <div className="ledger">
        {posts.map((post, i) => {
          const expired = isExpired(post);
          return (
            <Link to={`/posts/${post.id}`} key={post.id} className="ledger-row">
              <span className="ledger-num">{String(posts.length - i).padStart(2, "0")}</span>
              <div>
                <div className="ledger-title">{post.title}</div>
                <div className="ledger-meta">
                  {expired ? "Closed" : "Open"} · Expires {new Date(post.expiry_date).toLocaleDateString()}
                </div>
              </div>
              <span className={`tag ${expired ? "tag-closed" : "tag-open"}`}>
                {expired ? "Closed" : "Open"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
