import { createContext, useContext, useEffect, useState } from "react";
import * as api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if a token is sitting in localStorage from a previous
  // session, try to resolve it into a real account via /me. If the token
  // is expired or invalid, the backend returns 401/404 and we just clear it.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then((me) => setAccount(me))
      .catch(() => {
        api.clearToken();
        setAccount(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await api.login({ email, password });
    api.saveToken(res.access_token);
    const me = await api.getMe();
    setAccount(me);
    return me;
  }

  function logout() {
    api.clearToken();
    setAccount(null);
  }

  return (
    <AuthContext.Provider value={{ account, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
