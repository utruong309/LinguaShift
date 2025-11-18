export default function ChannelHeader({ channel, channelDetails, currentUserId }) {
  if (!channel) return null;

  const getChannelIcon = () => {
    if (channel.type === "direct") return "💬";
    return "#";
  };

  const getChannelName = () => {
    if (channel.type === "direct") {
      // Show the other person's name in direct messages
      if (channelDetails?.directPair) {
        const otherUser = channelDetails.directPair.find(u => 
          u._id !== currentUserId && u.id !== currentUserId
        );
        if (otherUser) {
          return otherUser.name || otherUser.email || "Direct Message";
        }
      }
      return "Direct Message";
    }
    return channel.name || "Unnamed Channel";
  };

  return (
    <div className="channel-header">
      <span className="channel-header-icon">{getChannelIcon()}</span>
      <h2>{getChannelName()}</h2>
      {channel.type === "group" && (
        <span className="channel-header-info">
          {channelDetails?.members?.length || channel.members?.length || 0} members
        </span>
      )}
      {channel.type === "direct" && channelDetails?.directPair && (
        <span className="channel-header-info">
          {channelDetails.directPair.find(u => 
            u._id !== currentUserId && u.id !== currentUserId
          )?.email || ""}
        </span>
      )}
    </div>
  );
}

