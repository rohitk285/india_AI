import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [username, setUsername] = useState(() => localStorage.getItem("username") || "");
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [userId, setUserId] = useState(() => localStorage.getItem("user_id") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("token"));

  useEffect(() => {
    setIsAuthenticated(!!token);
  }, [token]);

  const login = (username, jwtToken, user_id) => {
    setUsername(username);
    setToken(jwtToken);
    setUserId(user_id);
    localStorage.setItem("username", username);
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user_id", user_id);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUsername("");
    setToken("");
    setUserId("");
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ username, token, userId, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
