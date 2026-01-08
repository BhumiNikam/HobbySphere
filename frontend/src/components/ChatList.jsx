import { useAuth } from '../context/AuthContext';

export default function ChatList({ conversations, selectedConversation, onSelectConversation }) {
  const { user } = useAuth();

  const getOtherUser = (conversation) => {
    return conversation.participants.find(p => p._id !== user.id);
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 86400000) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diff < 604800000) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No conversations yet</p>
        <p className="text-sm text-gray-400 mt-2">Start a conversation from a user's profile</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-[calc(100vh-73px)]">
      {conversations.map((conversation) => {
        const otherUser = getOtherUser(conversation);
        const isSelected = selectedConversation?._id === conversation._id;
        
        return (
          <button
            key={conversation._id}
            onClick={() => onSelectConversation(conversation)}
            className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition border-b ${
              isSelected ? 'bg-blue-50' : ''
            }`}
          >
            <img
              src={otherUser.profileImage || `https://ui-avatars.com/api/?name=${otherUser.fullName}&background=random`}
              alt={otherUser.fullName}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900 truncate">{otherUser.fullName}</p>
                {conversation.lastMessage && (
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {formatTime(conversation.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">@{otherUser.username}</p>
              {conversation.lastMessage && (
                <p className="text-sm text-gray-500 truncate mt-1">
                  {conversation.lastMessage.sender === user.id ? 'You: ' : ''}
                  {conversation.lastMessage.text}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}