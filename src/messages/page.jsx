import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import { toast } from "react-toastify";
import { getDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useRef } from "react";

import {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  getUserConversations,
} from "../firebase/messagesService";
import { Send, Search, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listenToMessages } from "../firebase/messagesService";

export default function MessagesPage() {
  const { user, userData } = useAuth();
  const { user_id, host_id } = useParams();
  const [hostData, setHostData] = useState({});
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(0);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const isDirectChat = user_id && host_id;
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        if (isDirectChat) {
          // Direct chat between user and host
          const hostRef = doc(db, "users", host_id);
          const hostSnap = await getDoc(hostRef);
          if (!hostSnap.exists()) return toast.error("Host not found");

          const hostData = hostSnap.data();
          setHostData(hostData);

          const conv = await getOrCreateConversation(user_id, host_id);
          setConversationId(conv.id);

          const msgs = await getMessages(conv.id);
          setMessages(
            msgs.map((m) => ({
              id: m.id,
              text: m.text,
              sender: m.senderId,
              isOwn: m.senderId === user_id,
              time: m.createdAt?.toDate().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }))
          );

          // Sidebar still needs at least 1 conversation
          setConversations([
            {
              id: conv.id,
              name: hostData.fullName,
              avatar: hostData.photoURL,
              lastMessage: conv.lastMessage || "",
              property: "Modern Loft in Downtown",
              unread: 0,
            },
          ]);
        } else {
          if (!user?.uid) return;
          const allConvs = await getUserConversations(user.uid);

          // Fetch the other user's info for each conversation
          const enriched = await Promise.all(
            allConvs.map(async (conv) => {
              const otherId = conv.participants.find((p) => p !== user.uid);
              const userRef = doc(db, "users", otherId);
              const userSnap = await getDoc(userRef);
              const otherUser = userSnap.exists() ? userSnap.data() : {};

              return {
                id: conv.id,
                name: otherUser.fullName || "Unknown",
                avatar: otherUser.photoURL || "/profile-placeholder.png",
                lastMessage: conv.lastMessage || "",
                time: conv.updatedAt
                  ? conv.updatedAt.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "",
                unread: 0,
                participants: conv.participants,
              };
            })
          );

          setConversations(enriched);
          if (enriched.length > 0) setSelectedChat(0);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load messages");
      }
    };

    initChat();
  }, [isDirectChat, user_id, host_id]);

  useEffect(() => {
    const fetchMessagesForSelectedChat = async () => {
      // Wait until conversations and selectedChat are ready
      if (conversations.length === 0) return;
      const selectedConv = conversations[selectedChat];
      if (!selectedConv) return;

      setConversationId(selectedConv.id);

      try {
        const msgs = await getMessages(selectedConv.id);
        setMessages(
          msgs.map((m) => ({
            id: m.id,
            text: m.text,
            sender: m.senderId,
            isOwn: m.senderId === user?.uid,
            time: m.createdAt?.toDate().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }))
        );

        // Fetch chat header (the other user)
        const otherId = selectedConv.participants?.find((p) => p !== user?.uid);
        if (otherId) {
          const otherRef = doc(db, "users", otherId);
          const otherSnap = await getDoc(otherRef);
          if (otherSnap.exists()) setHostData(otherSnap.data());
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load messages");
      }
    };

    // Run only when both conversations and selectedChat are stable
    if (conversations.length > 0 && selectedChat !== null) {
      fetchMessagesForSelectedChat();
    }
  }, [selectedChat, conversations, user?.uid]);

  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to updates
    const unsubscribe = listenToMessages(conversationId, (msgs) => {
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          text: m.text,
          sender: m.senderId,
          isOwn: m.senderId === user?.uid,
          time: m.createdAt?.toDate().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }))
      );
    });

    // Cleanup listener on unmount or when chat changes
    return () => unsubscribe();
  }, [conversationId, user?.uid]);

  // 2️⃣ Handle sending
  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await sendMessage(conversationId, user.uid, message.trim());

      // add locally
      setMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    }
  };

  // 3️⃣ Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  //autoscroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  return (
    <div className="flex flex-col h-screen bg-slate-900">
      <NavigationBar user={user} userData={userData} forceSimpleNavBar={true} />

      <div className="flex flex-1 overflow-hidden mt-[70px]">
        {/* Sidebar - Hidden on mobile when viewing chat */}
        <div className={`absolute sm:relative w-full sm:w-80 lg:w-96 h-full ${showMobileChat ? "hidden" : "flex"} sm:flex bg-slate-800/80 backdrop-blur-lg border-r border-slate-700 flex-col z-40`}>
          <div className="p-4 lg:p-6 border-b border-slate-700">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search messages"
                className="w-full pl-12 pr-4 py-2 lg:py-3 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-900/50 text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv, index) => (
              <button
                key={conv.id}
                onClick={() => {
                  setSelectedChat(index);
                  setShowMobileChat(true);
                }}
                className={`w-full p-3 lg:p-4 flex items-start gap-3 hover:bg-slate-700/50 transition-all border-b border-slate-700 ${
                  selectedChat === index
                    ? "bg-indigo-600/20 border-l-4 border-l-indigo-500"
                    : ""
                }`}
              >
                <img
                  src={conv.avatar || "/profile-placeholder.png"}
                  alt={conv.name || ""}
                  className="w-12 lg:w-14 h-12 lg:h-14 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white truncate text-sm lg:text-base">
                      {conv.name}
                    </h3>
                    <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                      {conv.time || ""}
                    </span>
                  </div>
                  <p
                    className={`text-xs lg:text-sm truncate ${
                      conv.unread > 0
                        ? "font-semibold text-slate-200"
                        : "text-slate-400"
                    }`}
                  >
                    {conv.lastMessage || ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area - Full screen on mobile, flex with sidebar on tablet+ */}
        <div className={`absolute sm:relative w-full h-full sm:w-auto ${showMobileChat ? "flex" : "hidden"} sm:flex flex-1 flex-col bg-slate-900 z-30`}>
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-slate-700 flex items-center gap-3 lg:gap-4 bg-slate-800/50 backdrop-blur-lg">
            {/* Back Button - Mobile only */}
            <button
              onClick={() => setShowMobileChat(false)}
              className="sm:hidden p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <img
              src={hostData.photoURL || "/profile-placeholder.png"}
              alt={hostData.fullName || "User"}
              className="w-10 lg:w-14 h-10 lg:h-14 rounded-full object-cover ring-2 ring-indigo-500/30 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-white text-base lg:text-lg tracking-tight truncate">
                {hostData.fullName}
              </h2>
              <p className="text-xs lg:text-sm text-slate-400 capitalize">
                {hostData.role}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 lg:p-6 bg-slate-900 flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-slate-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">
                    No messages yet
                  </h3>
                  <p className="text-slate-400 text-sm lg:text-base mb-6">
                    Start a conversation with {hostData.fullName || "this user"} by sending your first message!
                  </p>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <p className="text-xs lg:text-sm text-slate-300">
                      💡 <span className="font-medium">Tip:</span> Be polite and clear in your message to get a better response.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-3 lg:space-y-4 w-full">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.isOwn ? "justify-end" : "justify-start"
                    }`}
                    ref={messagesEndRef}
                  >
                    <div
                      className={`max-w-xs sm:max-w-sm lg:max-w-lg ${msg.isOwn ? "order-2" : "order-1"}`}
                    >
                      <div
                        className={`px-4 lg:px-5 py-3 lg:py-4 rounded-2xl shadow-sm text-sm lg:text-base ${
                          msg.isOwn
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700"
                        }`}
                      >
                        <p className="leading-relaxed break-words">{msg.text}</p>
                      </div>
                      <p
                        className={`text-xs mt-1.5 font-medium ${
                          msg.isOwn
                            ? "text-right text-slate-400"
                            : "text-left text-slate-400"
                        }`}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 lg:p-6 border-t border-slate-700 bg-slate-800/50 backdrop-blur-lg">
            <div className="max-w-4xl mx-auto flex items-end gap-2 lg:gap-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 px-3 lg:px-5 py-2 lg:py-3 border-2 border-slate-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-900/50 text-white placeholder-slate-500 text-sm lg:text-base"
              />
              <button
                onClick={handleSend}
                className="mb-1.5 p-2.5 lg:p-4 bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all shadow-md flex-shrink-0"
              >
                <Send className="w-4 lg:w-5 h-4 lg:h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
