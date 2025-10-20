import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavBar2 from "../components/NavigationBarForPandM";
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
import { Send, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listenToMessages } from "../firebase/messagesService";

export default function MessagesPage() {
  const { user } = useAuth();
  const { user_id, host_id } = useParams();
  const [hostData, setHostData] = useState({});
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(0);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
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
                avatar: otherUser.photoURL || "/default-avatar.png",
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
    <div className="flex flex-col h-screen bg-gray-50">
      <NavBar2 />

      <div className="flex flex-1 overflow-hidden mt-[70px]">
        {/* Sidebar */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search messages"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-gray-50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv, index) => (
              <button
                key={conv.id}
                onClick={() => setSelectedChat(index)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-all border-b border-gray-100 ${
                  selectedChat === index
                    ? "bg-slate-100 border-l-4 border-l-slate-900"
                    : ""
                }`}
              >
                <img
                  src={conv.avatar || null}
                  alt={conv.name || ""}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900 truncate">
                      {conv.name}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2">
                      {conv.time || ""}
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate ${
                      conv.unread > 0
                        ? "font-bold text-gray-900"
                        : "text-gray-600"
                    }`}
                  >
                    {conv.lastMessage || ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center gap-4 bg-white shadow-sm rounded-t-xl">
            <img
              src={hostData.photoURL}
              alt={hostData.fullName}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500/30"
            />
            <div>
              <h2 className="font-semibold text-gray-900 text-lg tracking-tight">
                {hostData.fullName}
              </h2>
              <p className="text-sm text-gray-500 capitalize">
                {hostData.role}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.isOwn ? "justify-end" : "justify-start"
                  }`}
                  ref={messagesEndRef}
                >
                  <div
                    className={`max-w-lg ${msg.isOwn ? "order-2" : "order-1"}`}
                  >
                    <div
                      className={`px-5 py-4 rounded-2xl shadow-sm ${
                        msg.isOwn
                          ? "bg-slate-900 text-white rounded-br-sm"
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    <p
                      className={`text-xs mt-1.5 font-medium ${
                        msg.isOwn
                          ? "text-right text-gray-500"
                          : "text-left text-gray-500"
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-6 border-t border-gray-200 bg-white">
            <div className="max-w-4xl mx-auto flex items-end gap-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 px-5 py-3 pr-12 border-2 border-gray-400 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                onClick={handleSend}
                className="mb-1.5 p-4 bg-slate-900 hover:bg-slate-800 rounded-full transition-all shadow-md"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
