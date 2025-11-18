import { useState } from "react";
import UserSearch from "./UserSearch";
import { useAuth } from "../context/AuthContext";

export default function ChannelList({ channels, activeChannel, currentUserId, onSelect, onCreateGroup, onCreateDirect }) {
  const { user } = useAuth();
  
  const getDirectMessageName = (channel) => {
    if (channel.type !== "direct") return null;
    if (channel.details?.directPair) {
      const otherUser = channel.details.directPair.find(u => 
        u._id !== currentUserId && u.id !== currentUserId
      );
      if (otherUser) {
        return otherUser.name || otherUser.email || "Direct Message";
      }
    }
    return "Direct Message";
  };
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [groupName, setGroupName] = useState("");

  const groupChannels = channels.filter(c => c.type === "group");
  const directChannels = channels.filter(c => c.type === "direct");

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (groupName.trim()) {
      onCreateGroup(groupName.trim());
      setGroupName("");
      setShowGroupModal(false);
    }
  };

  const handleSelectUser = (selectedUser) => {
    onCreateDirect(selectedUser.id);
    setShowDirectModal(false);
  };

    return (
      <div className="channels">
      <div className="channel-section">
        <div className="section-header">
          <span>Channels</span>
          <button onClick={() => setShowGroupModal(true)} title="Create channel">+</button>
        </div>
        {groupChannels.map(c => (
          <button
            key={c._id}
            className={`channel-item ${activeChannel?._id === c._id ? "active" : ""}`}
            onClick={() => onSelect(c)}
          >
            <span className="channel-icon">#</span>
            <span className="channel-name">{c.name}</span>
          </button>
        ))}
      </div>

      <div className="channel-section">
        <div className="section-header">
          <span>Direct Messages</span>
          <button onClick={() => setShowDirectModal(true)} title="New message">+</button>
        </div>
        {directChannels.map(c => (
          <button
            key={c._id}
            className={`channel-item ${activeChannel?._id === c._id ? "active" : ""}`}
            onClick={() => onSelect(c)}
          >
            <span className="channel-icon">💬</span>
            <span className="channel-name">{getDirectMessageName(c)}</span>
          </button>
        ))}
      </div>

      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Channel</h3>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                placeholder="Channel name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowGroupModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDirectModal && (
        <div className="modal-overlay" onClick={() => setShowDirectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <h3>New Direct Message</h3>
            <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "16px" }}>
              Search for a user by name or email to start a conversation
            </p>
            <UserSearch 
              onSelectUser={handleSelectUser}
              excludeUserId={user?.id}
            />
            <div className="modal-actions" style={{ marginTop: "16px" }}>
              <button type="button" className="secondary" onClick={() => setShowDirectModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    );
  }  
