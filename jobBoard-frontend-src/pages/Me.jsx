import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as api from "../api";

export default function Me() {
  const { account, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !account) navigate("/login");
  }, [authLoading, account, navigate]);

  if (authLoading || !account) return null;

  return (
    <div className="page">
      <div className="hero" style={{ paddingTop: 48 }}>
        <p>{account.role}</p>
        <h1>{account.name}</h1>
        <p style={{ marginTop: 8 }}>{account.email}</p>
      </div>

      {account.role === "freelancer" ? (
        <MyApplications account={account} />
      ) : (
        <MyPosts account={account} />
      )}
    </div>
  );
}

function MyApplications({ account }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  function load() {
    setLoading(true);
    api
      .getMyApplications(account.id)
      .then(setApplications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [account.id]);

  async function handleWithdraw(id) {
    if (!confirm("Withdraw this application?")) return;
    try {
      await api.deleteApplication(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(app) {
    setEditingId(app.id);
    setEditContent(app.content);
  }

  async function saveEdit(id) {
    try {
      await api.updateApplication(id, { content: editContent });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div className="section-head">
        <h2 style={{ fontSize: 18 }}>My applications</h2>
      </div>
      {error && <div className="error-box">{error}</div>}
      {loading && <p className="muted mono">Loading...</p>}
      {!loading && applications.length === 0 && (
        <div className="empty">You haven't applied to anything yet.</div>
      )}
      {applications.map((app) => (
        <div key={app.id} className="card" style={{ marginBottom: 12 }}>
          <div className="muted mono" style={{ fontSize: 12, marginBottom: 8 }}>
            Post #{app.post_id} · Applied {new Date(app.created_at).toLocaleDateString()}
          </div>
          {editingId === app.id ? (
            <>
              <div className="field">
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-small" onClick={() => saveEdit(app.id)}>Save</button>
                <button className="btn btn-outline btn-small" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <p style={{ whiteSpace: "pre-wrap" }}>{app.content}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Link to={`/posts/${app.post_id}`} className="btn btn-outline btn-small">View post</Link>
                <button className="btn btn-outline btn-small" onClick={() => startEdit(app)}>Edit</button>
                <button className="btn btn-danger btn-small" onClick={() => handleWithdraw(app.id)}>Withdraw</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function MyPosts({ account }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // No "my posts" backend route yet - fetch all, filter client-side.
  function load() {
    setLoading(true);
    api
      .getPosts()
      .then((all) => setPosts(all.filter((p) => p.author_id === account.id)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [account.id]);

  async function handleDelete(id) {
    if (!confirm("Delete this post? All applications to it will be removed too.")) return;
    try {
      await api.deletePost(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(post) {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
  }

  async function saveEdit(id) {
    try {
      await api.updatePost(id, { title: editTitle, content: editContent });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div className="section-head">
        <h2 style={{ fontSize: 18 }}>My posted jobs</h2>
      </div>
      {error && <div className="error-box">{error}</div>}
      {loading && <p className="muted mono">Loading...</p>}
      {!loading && posts.length === 0 && (
        <div className="empty">You haven't posted any jobs yet — do that from the board.</div>
      )}
      {posts.map((post) => {
        const expired = new Date(post.expiry_date) < new Date();
        return (
          <div key={post.id} className="card" style={{ marginBottom: 12 }}>
            <div className="muted mono" style={{ fontSize: 12, marginBottom: 8 }}>
              {expired ? "Closed" : "Open"} · Expires {new Date(post.expiry_date).toLocaleDateString()}
            </div>
            {editingId === post.id ? (
              <>
                <div className="field">
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div className="field">
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-small" onClick={() => saveEdit(post.id)}>Save</button>
                  <button className="btn btn-outline btn-small" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: 18 }}>{post.title}</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Link to={`/posts/${post.id}/applicants`} className="btn btn-small">Applicants</Link>
                  <button className="btn btn-outline btn-small" onClick={() => startEdit(post)}>Edit</button>
                  <button className="btn btn-danger btn-small" onClick={() => handleDelete(post.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
