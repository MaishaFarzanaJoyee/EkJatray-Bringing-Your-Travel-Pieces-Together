import { createContext, useContext, useMemo, useState } from "react";

const TOKEN_KEY = "ekjatrayToken";
const USER_KEY = "ekjatrayUser";

const AuthContext = createContext(null);

function parseStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => parseStoredUser());

  const login = ({ token: nextToken, user: nextUser }) => {
    const safeToken = nextToken || "";
    const safeUser = nextUser || null;

    setToken(safeToken);
    setUser(safeUser);

    if (safeToken) {
      localStorage.setItem(TOKEN_KEY, safeToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }

    if (safeUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("ekjatrayTransportCart");
  };

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role || "user",
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
