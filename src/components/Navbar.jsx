import { NavLink } from "react-router-dom";
import { useState,useEffect } from "react";

export default function Navbar() {
  const [theme, setTheme] = useState("light");
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState(null);
  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("token");

  if (urlToken) {
    localStorage.setItem("spotify_token", urlToken);
    setToken(urlToken);

    // 🔥 REMOVE token from URL after saving
    window.history.replaceState({}, document.title, "/");
  } else {
    const storedToken = localStorage.getItem("spotify_token");
    if (storedToken) setToken(storedToken);
  }
}, []);

  // 👇 ADD THIS ALSO
  useEffect(() => {
    if (token) {
      fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setProfile(data));
    }
  }, [token]);
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.body.className = newTheme;
  };
  const logout = () => {
    localStorage.removeItem("spotify_token");
    setToken("");
    setProfile(null);
  };
  return (
    <nav className="navbar">
      {/* Left */}
      <div className="nav-left">
        🎵 Music Studio
      </div>

      {/* Center */}
      <div className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/merger">Merger</NavLink>
        <NavLink to="/lyrics">Lyrics</NavLink>
        <NavLink to="/separator">Separator</NavLink>
        <NavLink to="/music">Music</NavLink>
      </div>

      {/* Right */}
      <div className="nav-right">
        <button className="theme-btn" onClick={toggleTheme}>
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        {!token ? (
  <a href="http://127.0.0.1:8000/spotify/login">
    <button className="login-btn">Connect Spotify</button>
  </a>
) : (
  <div onClick={logout} style={{ cursor: "pointer" }}>
    {profile?.images?.length ? (
      <img
        src={profile.images[0].url}
        alt="profile"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
        }}
      />
    ) : (
      "👤"
    )}
  </div>
)}
      </div>
    </nav>
  );
}
