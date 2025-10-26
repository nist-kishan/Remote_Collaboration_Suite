import React from "react";
import { MessageCircle, Users, Phone, Video, MoreVertical } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { useUserStatus } from "../../hook/useUserStatus";
import UnreadBadge from "../chat/UnreadBadge";

const ChatItem = ({
  chat,
  isSelected = false,
  onClick,
  onVideoCall,
  onMenuClick,
  currentUserId,
  className = "",
}) => {
  const { isUserOnline } = useUserStatus();

  const getChatName = () => {
    if (chat.type === "group") {
      return chat.name || "Group Chat";
    }
    if (chat.type === "chatted_group") {
      return chat.name || "Group Chat";
    }
    if (chat.type === "chatted_user") {
      return chat.name || "Unknown User";
    }
    if (chat.type === "user") {
      return chat.name || chat.user?.name || "Unknown User";
    }
    if (!chat.participants || !Array.isArray(chat.participants)) {
      return "Unknown User";
    }
    const otherParticipant = chat.participants.find(
      (p) => p.user && p.user._id !== currentUserId
    );
    return otherParticipant?.user?.name || "Unknown User";
  };

  const getChatAvatar = () => {
    if (chat.type === "group" || chat.type === "chatted_group") {
      return null;
    }
    if (chat.type === "chatted_user") {
      const otherParticipant = chat.participants?.find(
        (p) => p.user && p.user._id !== currentUserId
      );
      return otherParticipant?.user || null;
    }
    if (chat.type === "user") {
      return chat.user || null;
    }
    if (!chat.participants || !Array.isArray(chat.participants)) {
      return null;
    }
    const otherParticipant = chat.participants.find(
      (p) => p.user && p.user._id !== currentUserId
    );
    return otherParticipant?.user || null;
  };

  const getLastMessage = () => {
    if (!chat.lastMessage) return "No messages yet";

    const { lastMessage } = chat;
    if (lastMessage.type === "image") return "📷 Image";
    if (lastMessage.type === "video") return "🎥 Video";
    if (lastMessage.type === "audio") return "🎵 Audio";
    if (lastMessage.type === "file") return "📄 File";

    return lastMessage.content || "No messages yet";
  };

  const getLastMessageTime = () => {
    if (!chat.lastMessage) return "";

    const date = new Date(chat.lastMessage.createdAt);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getUnreadCount = () => {
    // Handle both Map and number formats for unread count
    if (
      typeof chat.unreadCount === "object" &&
      chat.unreadCount instanceof Map &&
      currentUserId
    ) {
      return chat.unreadCount.get(currentUserId) || 0;
    }
    return chat.unreadCount || 0;
  };

  const isOnline = chat.participants?.some(
    (p) => p.user && isUserOnline(p.user._id)
  );

  const unreadCount = getUnreadCount();
  const hasUnreadMessages = unreadCount > 0;

  return (
    <div
      className={`flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 border-b border-gray-100 dark:border-gray-700 ${
        isSelected
          ? "bg-indigo-100 dark:bg-indigo-900/30 border-l-4 border-l-indigo-500 shadow-sm"
          : "hover:bg-gray-50 dark:hover:bg-gray-800"
      } ${className}`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {chat.type === "group" || chat.type === "chatted_group" ? (
          <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : (
          <UserAvatar
            user={getChatAvatar()}
            size="xl"
            showOnlineStatus={false}
            isOnline={isOnline}
          />
        )}
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3
              className={`text-base truncate ${
                isSelected
                  ? "text-indigo-900 dark:text-indigo-100 font-semibold"
                  : hasUnreadMessages
                  ? "text-gray-900 dark:text-gray-100 font-bold"
                  : "text-gray-900 dark:text-gray-100 font-normal"
              }`}
            >
              {getChatName()}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {getLastMessageTime() && (
              <span
                className={`text-xs ${
                  hasUnreadMessages
                    ? "text-gray-900 dark:text-gray-100 font-bold"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {getLastMessageTime()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm truncate ${
                isSelected
                  ? "text-indigo-700 dark:text-indigo-300"
                  : hasUnreadMessages
                  ? "text-gray-900 dark:text-gray-100 font-bold"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {getLastMessage()}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {/* Unread count badge */}
            <UnreadBadge chat={chat} currentUserId={currentUserId} />

            {/* Member count for groups */}
            {(chat.type === "group" || chat.type === "chatted_group") && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                <Users className="w-3 h-3" />
                <span>
                  {chat.memberCount || chat.participants?.length || 0}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {chat.type === "one-to-one" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVideoCall?.(chat);
                  }}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Video call"
                >
                  <Video className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuClick?.(chat);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatItem;
