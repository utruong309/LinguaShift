import { useState } from "react";

export default function MessageList({ messages, currentUserId, onEdit, onDelete, onReply }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

  const formatMessage = (text) => {
    if (!text) return "";
    // Simple formatting - convert newlines to breaks
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <div>No messages yet. Start the conversation!</div>
      </div>
    );
  }

  return (
    <div className="messages">
      {messages.map((m, index) => {
        const isOwnMessage = m.senderId?._id === currentUserId || m.senderId?.id === currentUserId;
        const showAvatar = index === 0 || messages[index - 1]?.senderId?._id !== m.senderId?._id;
        const isDeleted = !!m.deletedAt;

        return (
          <div key={m._id} className="message">
            {showAvatar ? (
              <div className="message-avatar">
                {getInitials(m.senderId?.name)}
              </div>
            ) : (
              <div style={{ width: "36px" }} />
            )}
            <div className="message-content">
              {showAvatar && (
                <div className="message-header">
                  <span className="message-author">{m.senderId?.name || "Unknown"}</span>
                  <span className="message-timestamp">{formatTime(m.createdAt)}</span>
                  {m.editedAt && (
                    <span className="message-timestamp" style={{ fontStyle: "italic" }}>
                      (edited)
                    </span>
                  )}
                </div>
              )}
              <div className={`message-text ${isDeleted ? "deleted" : ""}`}>
                {isDeleted ? (
                  <em>This message was deleted</em>
                ) : editingId === m._id ? (
                  <div className="message-editing">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onEdit(m, draft);
                          setEditingId(null);
                        }
                        if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                      autoFocus
                    />
                    <div className="message-editing-actions">
                      <button
                        className="message-action-btn"
                        onClick={() => {
                          onEdit(m, draft);
                          setEditingId(null);
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="message-action-btn"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
          </div>
                ) : (
                  <>
                    {formatMessage(m.textOriginal)}
                    {m.jargonScore != null && m.jargonScore > 0.2 && (
                      <span className="jargon-badge">
                        Jargon: {(m.jargonScore * 100).toFixed(0)}%
                      </span>
                    )}
                    {m.attachments?.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="attachment-link"
                      >
                        📎 {att.name}
                      </a>
                    ))}
              </>
            )}
          </div>
            </div>
            {!isDeleted && isOwnMessage && editingId !== m._id && (
              <div className="message-actions">
                <button
                  className="message-action-btn"
                  onClick={() => onReply(m)}
                  title="Reply"
                >
                  Reply
                </button>
                <button
                  className="message-action-btn"
                  onClick={() => {
                    setEditingId(m._id);
                    setDraft(m.textOriginal);
                  }}
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  className="message-action-btn"
                  onClick={() => {
                    if (window.confirm("Delete this message?")) {
                      onDelete(m);
                    }
                  }}
                  title="Delete"
                >
                  Delete
                </button>
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
