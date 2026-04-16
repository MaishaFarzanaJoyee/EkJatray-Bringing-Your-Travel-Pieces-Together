import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function linkClass({ isActive }) {
  return isActive ? "menu-btn is-active" : "menu-btn";
}

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <NavLink className="logo-area" to="/" aria-label="EkJatray home">
        <img className="logo-img" src="/asset/logo.png" alt="EkJatray logo" />
        <span className="logo-text">
          <strong>EkJatray</strong>
          <small>Bringing your travel pieces together</small>
        </span>
      </NavLink>

      <div className="menu">
        <NavLink to="/" className={linkClass} end>
          Home
        </NavLink>

        {!isAuthenticated && (
          <>
            <NavLink to="/login" className={linkClass}>
              Login
            </NavLink>
            <NavLink to="/register" className={linkClass}>
              Register
            </NavLink>
          </>
        )}

        {isAuthenticated && (
          <NavLink to="/budget" className={linkClass}>
            Manage Budget
          </NavLink>
        )}

        {isAuthenticated && role === "admin" && (
          <NavLink to="/admin" className={linkClass}>
            Admin Panel
          </NavLink>
        )}

        {isAuthenticated && (
          <button type="button" className="button-light" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
