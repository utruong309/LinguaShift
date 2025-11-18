import { useState, useEffect } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";

export default function UserSearch({ onSelectUser, excludeUserId, placeholder = "Search users by name or email..." }) {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setUsers([]);
      setShowResults(false);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const results = await apiFetch(`/auth/users/search?q=${encodeURIComponent(searchTerm)}`, { token });
        // Filter out the current user if excludeUserId is provided
        const filtered = excludeUserId 
          ? results.filter(u => u.id !== excludeUserId)
          : results;
        setUsers(filtered);
        setShowResults(true);
      } catch (err) {
        console.error("User search error:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, token, excludeUserId]);

  const handleSelect = (user) => {
    onSelectUser(user);
    setSearchTerm("");
    setUsers([]);
    setShowResults(false);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="user-search" style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        autoFocus
        style={{
          width: "100%",
          padding: "12px",
          background: "#1a1d21",
          border: "1px solid #3d4147",
          borderRadius: "4px",
          color: "#d1d2d3",
          fontSize: "15px",
        }}
      />
      {loading && (
        <div style={{ 
          position: "absolute", 
          right: "12px", 
          top: "50%", 
          transform: "translateY(-50%)",
          color: "#9ca3af",
          fontSize: "12px"
        }}>
          Searching...
        </div>
      )}
      {showResults && users.length > 0 && (
        <div className="user-search-results" style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "4px",
          background: "#2c2d30",
          border: "1px solid #3d4147",
          borderRadius: "4px",
          maxHeight: "300px",
          overflowY: "auto",
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        }}>
          {users.map(user => (
            <div
              key={user.id}
              onClick={() => handleSelect(user)}
              style={{
                padding: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                borderBottom: "1px solid #3d4147",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => e.target.style.background = "#3d4147"}
              onMouseLeave={(e) => e.target.style.background = "transparent"}
            >
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "4px",
                background: "#1264a3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "600",
                fontSize: "14px",
                textTransform: "uppercase",
                flexShrink: 0,
              }}>
                {getInitials(user.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  color: "#fff", 
                  fontWeight: "600", 
                  fontSize: "15px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {user.name}
                </div>
                <div style={{ 
                  color: "#9ca3af", 
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {user.email}
                </div>
                {user.department && (
                  <div style={{ 
                    color: "#9ca3af", 
                    fontSize: "12px",
                    marginTop: "2px",
                  }}>
                    {user.department}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {showResults && !loading && searchTerm.length >= 2 && users.length === 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "4px",
          background: "#2c2d30",
          border: "1px solid #3d4147",
          borderRadius: "4px",
          padding: "12px",
          color: "#9ca3af",
          fontSize: "14px",
          zIndex: 1000,
        }}>
          No users found
        </div>
      )}
    </div>
  );
}

