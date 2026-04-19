import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMyProfile } from "../services/authService";

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
  const [isAuthLoading, setIsAuthLoading] = useState(false);

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

  const setUserProfile = (nextUser) => {
    const safeUser = nextUser || null;
    setUser(safeUser);

    if (safeUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  useEffect(() => {
    if (!token || user) {
      return;
    }

    let isMounted = true;

    (async () => {
      setIsAuthLoading(true);
      try {
        const profile = await getMyProfile();
        if (isMounted) {
          setUserProfile(profile?.user || null);
        }
      } catch {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role || "user",
      isAuthenticated: Boolean(token),
      isAuthLoading,
      login,
      logout,
      setUserProfile,
    }),
    [token, user, isAuthLoading]
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
