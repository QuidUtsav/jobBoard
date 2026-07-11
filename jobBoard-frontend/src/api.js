const BASE_URL = "https://job-board-j5a2mpbs9-utsav14.vercel.app";

// Reads the JWT out of localStorage. Returns null if not logged in.
function getToken() {
  return localStorage.getItem("token");
}

export function saveToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

// Core request helper. Every page-level function below calls this.
// - Automatically attaches Authorization header if a token exists.
// - Automatically JSON-encodes the body, if provided.
// - Throws an Error with the backend's `detail` message on non-2xx responses,
//   so callers can just try/catch and show err.message.
async function request(path, { method = "GET", body, form = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let fetchBody = undefined;
  if (body !== undefined) {
    if (form) {
      // Login endpoint expects x-www-form-urlencoded (OAuth2PasswordRequestForm),
      // not JSON — FastAPI's form_data.username / form_data.password.
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      fetchBody = new URLSearchParams(body).toString();
    } else {
      headers["Content-Type"] = "application/json";
      fetchBody = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: fetchBody,
  });

  // 204/no-content or plain string responses (some of your DELETE routes
  // return a bare string, not JSON) - handle both.
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    // FastAPI's HTTPException body looks like { "detail": "..." }
    const message =
      (data && typeof data === "object" && data.detail) ||
      (typeof data === "string" && data) ||
      "Something went wrong.";
    throw new Error(message);
  }

  return data;
}

// ---- Auth ----
export function signup({ name, email, password, role }) {
  return request("/signup", {
    method: "POST",
    body: { name, email, password, role },
  });
}

export function login({ email, password }) {
  // OAuth2PasswordRequestForm reads `username`, so we send email as username.
  return request("/login", {
    method: "POST",
    body: { username: email, password },
    form: true,
  });
}

export function getMe() {
  return request("/me");
}

// ---- Accounts ----
export function getAccounts() {
  return request("/accounts");
}

// ---- Posts ----
export function getPosts() {
  return request("/posts");
}

export function createPost({ title, content }) {
  return request("/posts", { method: "POST", body: { title, content } });
}

export function updatePost(postId, { title, content }) {
  return request(`/post/${postId}`, {
    method: "PUT",
    body: { title, content },
  });
}

export function deletePost(postId) {
  return request(`/post/${postId}`, { method: "DELETE" });
}

// ---- Applications ----
export function applyToPost({ post_id, content }) {
  return request("/application", {
    method: "POST",
    body: { post_id, content },
  });
}

export function getApplicationsForPost(postId) {
  return request(`/post/${postId}/applications`);
}

export function getMyApplications(userId) {
  return request(`/application/${userId}`);
}

export function updateApplication(applicationId, { content }) {
  return request(`/application/${applicationId}`, {
    method: "PUT",
    body: { content },
  });
}

export function deleteApplication(applicationId) {
  return request(`/application/${applicationId}`, { method: "DELETE" });
}
