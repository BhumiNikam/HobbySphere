import { useAuth } from '../context/AuthContext';

export default function ChatList({
  conversations,
  selectedConversation,
  onSelectConversation,
}) {
  const { user } = useAuth();

  const getOtherUser = (conversation) =>
    conversation.participants.find(p => p._id !== user._id && p._id !== user.id);

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 86400000) {
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    if (diff < 604800000) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  /* =========================
     EMPTY STATE
     ========================= */
  if (conversations.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-slate-600 dark:text-slate-300 font-medium">No conversations yet</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
          Start a conversation from a user's profile
        </p>
      </div>
    );
  }

  /* =========================
     LIST
     ========================= */
  return (
    <div className="overflow-y-auto h-[calc(100vh-73px)] divide-y divide-slate-100 dark:divide-slate-800">
      {conversations.map(conversation => {
        const otherUser = getOtherUser(conversation);
        const isActive = selectedConversation?._id === conversation._id;

        return (
          <button
            key={conversation._id}
            onClick={() => onSelectConversation(conversation)}
            className={`
              w-full px-4 py-4 flex items-start gap-3 text-left
              transition-colors duration-150
              hover:bg-slate-50 dark:hover:bg-slate-800
              ${isActive 
                ? 'bg-indigo-50 dark:bg-indigo-950/30' 
                : 'bg-white dark:bg-slate-900'
              }
            `}
          >
            {/* Avatar */}
            <img
              src={
                otherUser.profileImage ||
                `https://ui-avatars.com/api/?name=${otherUser.fullName}&background=6366f1&color=fff`
              }
              alt={otherUser.fullName}
              className="w-11 h-11 rounded-full object-cover flex-shrink-0"
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Top row */}
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`truncate font-semibold ${
                    isActive 
                      ? 'text-indigo-700 dark:text-indigo-400' 
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {otherUser.fullName}
                </p>

                {conversation.lastMessage && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                    {formatTime(conversation.lastMessage.createdAt)}
                  </span>
                )}
              </div>

              {/* Username */}
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                @{otherUser.username}
              </p>

              {/* Last message */}
              {conversation.lastMessage && (
                <p
                  className={`
                    text-sm truncate mt-1
                    ${
                      isActive
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  `}
                >
                  {(conversation.lastMessage.sender === user.id || 
                    conversation.lastMessage.sender === user._id) && (
                    <span className="font-medium">You: </span>
                  )}
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