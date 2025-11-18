import { useEffect, useState, useRef } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { apiFetch } from "./api";
import AuthForm from "./components/AuthForm";
import ChannelList from "./components/ChannelList";
import MessageList from "./components/MessageList";
import Composer from "./components/Composer";
import ChannelHeader from "./components/ChannelHeader";
import GlossaryManager from "./components/GlossaryManager";
import "./App.css";

function Main() {
  const { token, user, logout } = useAuth();
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeChannelDetails, setActiveChannelDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeView, setActiveView] = useState('chat'); // 'chat' or 'glossary'
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    const loadChannels = async () => {
      try {
        const channelsData = await apiFetch("/channels", { token });
        const channelsWithDetails = await Promise.all(
          channelsData.map(async (ch) => {
            if (ch.type === "direct") {
              try {
                const details = await apiFetch(`/channels/${ch._id}`, { token });
                return { ...ch, details };
              } catch {
                return ch;
              }
            }
            return ch;
          })
        );
        setChannels(channelsWithDetails);
      } catch (err) {
        console.error("Failed to load channels:", err);
        if (err.message.includes("Cannot connect to server")) {
          alert("Cannot connect to server. Please make sure the backend is running.\n\nStart it with: cd backend && npm run dev");
        }
      }
    };
    loadChannels();
  }, [token]);

  useEffect(() => {
    if (!token || !activeChannel || activeView !== 'chat') return;
    
    apiFetch(`/channels/${activeChannel._id}`, { token })
      .then(setActiveChannelDetails)
      .catch(err => {
        console.error("Failed to load channel details:", err);
      });

    const loadMessages = () => {
      apiFetch(`/channels/${activeChannel._id}/messages`, { token })
        .then(setMessages)
        .catch(err => {
          console.error("Failed to load messages:", err);
        });
    };

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [token, activeChannel, activeView]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const refreshMessages = () => {
    if (!activeChannel) return;
    apiFetch(`/channels/${activeChannel._id}/messages`, { token })
      .then(setMessages)
      .catch(err => {
        console.error("Failed to refresh messages:", err);
      });
  };

  const send = async (payload) => {
    await apiFetch(`/channels/${activeChannel._id}/messages`, { method: "POST", token, body: payload });
    refreshMessages();
  };

  const edit = async (msg, textOriginal) => {
    await apiFetch(`/channels/${activeChannel._id}/messages/${msg._id}`, { method: "PATCH", token, body: { textOriginal } });
    refreshMessages();
  };

  const del = async (msg) => {
    await apiFetch(`/channels/${activeChannel._id}/messages/${msg._id}`, { method: "DELETE", token });
    refreshMessages();
  };

  const createGroup = async (name) => {
    if (!name) return;
    try {
      const ch = await apiFetch("/channels", { method: "POST", token, body: { name } });
      setChannels(prev => [...prev, ch]);
      setActiveChannel(ch);
      setActiveView('chat');
    } catch (err) {
      console.error("Failed to create channel:", err);
    }
  };

  const createDirect = async (userId) => {
    if (!userId) return;
    try {
      const ch = await apiFetch("/channels/direct", { method: "POST", token, body: { userId } });
      if (!channels.find(c => c._id === ch._id)) {
        setChannels(prev => [...prev, ch]);
      }
      setActiveChannel(ch);
      setActiveView('chat');
    } catch (err) {
      console.error("Failed to create direct message:", err);
    }
  };

  if (!token) return <AuthForm />;

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
    <div className="layout">
      <aside>
        <div className="sidebar-header">
          <h1>LinguaShift</h1>
        </div>
        <div className="user-profile">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-status">Active</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">
            ⚙️
          </button>
        </div>
        
        {/* Glossary Button */}
        <div className="channel-section">
          <div className="section-header">
            <span>Settings</span>
          </div>
          <button
            className={`channel-item ${activeView === 'glossary' ? 'active' : ''}`}
            onClick={() => {
              setActiveView('glossary');
              setActiveChannel(null);
            }}
          >
            <span className="channel-icon">📚</span>
            <span className="channel-name">Glossary</span>
          </button>
        </div>

        <ChannelList 
          channels={channels} 
          activeChannel={activeChannel}
          currentUserId={user?.id}
          onSelect={(ch) => {
            setActiveChannel(ch);
            setActiveView('chat');
          }} 
          onCreateGroup={createGroup} 
          onCreateDirect={createDirect} 
        />
      </aside>
      <main>
        {activeView === 'glossary' ? (
          <GlossaryManager />
        ) : activeChannel ? (
          <>
            <ChannelHeader channel={activeChannel} channelDetails={activeChannelDetails} currentUserId={user?.id} />
            <div className="messages-container">
              <MessageList 
                messages={messages} 
                currentUserId={user?.id}
                onEdit={edit} 
                onDelete={del} 
                onReply={() => {}} 
              />
              <div ref={messagesEndRef} />
            </div>
            <Composer channelId={activeChannel._id} onSend={send} />
          </>
        ) : (
          <div className="empty-state">
            <div>Select a channel to start messaging</div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}