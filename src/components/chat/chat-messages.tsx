"use client";

import { useQuery, useMutation } from "convex/react";
// @ts-ignore
import { api } from "../../../convex/_generated/api";
// @ts-ignore
import { Id } from "../../../convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { MessageTimestamp } from "./message-timestamp";
import { cn } from "@/lib/utils";
import { ArrowDown, Trash2, Smile, Check, CheckCheck, Search, X } from "lucide-react";

export function ChatMessages({ conversationId, meId }: { conversationId: Id<"conversations">; meId: Id<"users"> }) {
    const [searchTerm, setSearchTerm] = useState("");
    const messages = useQuery((api as any).messages.list, { conversationId });
    const searchResults = useQuery((api as any).messages.search, { conversationId, searchTerm });
    const typingUsers = useQuery((api as any).typing.getTyping, { conversationId });
    const toggleReaction = useMutation((api as any).messages.toggleReaction);
    const softDelete = useMutation((api as any).messages.softDelete);
    const markRead = useMutation((api as any).messages.markRead);
    const readReceipts = useQuery((api as any).messages.getReadReceipts, { conversationId });

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [hoveredMessageId, setHoveredMessageId] = useState<Id<"messages"> | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState<Id<"messages"> | null>(null);

    const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

    useEffect(() => {
        if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.senderId !== meId) {
                markRead({ conversationId, messageId: lastMessage._id });
            }
        }
    }, [messages, conversationId, meId, markRead]);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior,
            });
        }
    };

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 100;

        if (isAtBottom) {
            scrollToBottom("instant");
        } else {
            setShowScrollButton(true);
        }
    }, [messages]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
        setShowScrollButton(!isAtBottom);
    };

    if (messages === undefined) return <div className="flex-1" />;

    const displayMessages = searchTerm ? searchResults : messages;

    return (
        <div className="relative flex-1 overflow-hidden bg-zinc-50 flex flex-col">
            {/* Search Bar */}
            <div className="bg-white border-b px-4 py-2 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search in conversation..."
                        className="w-full bg-zinc-100 rounded-full pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <X className="h-3 w-3 text-zinc-400 hover:text-zinc-600" />
                        </button>
                    )}
                </div>
            </div>

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {displayMessages === undefined ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                ) : displayMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <p className="text-sm text-zinc-500">
                            {searchTerm ? "No results found" : "No messages yet. Say hello!"}
                        </p>
                    </div>
                ) : (
                    displayMessages.map((message: any) => {
                        const isMe = message.senderId === meId;
                        const otherReadReceipt = readReceipts?.find((r: any) => r.userId !== meId);
                        const isRead = otherReadReceipt && otherReadReceipt.lastReadMessageId === message._id;

                        return (
                            <div
                                key={message._id}
                                onMouseEnter={() => setHoveredMessageId(message._id)}
                                onMouseLeave={() => {
                                    setHoveredMessageId(null);
                                    if (showEmojiPicker !== message._id) setShowEmojiPicker(null);
                                }}
                                className={cn(
                                    "flex flex-col gap-1 relative",
                                    isMe ? "items-end" : "items-start"
                                )}
                            >
                                <div className="flex items-center gap-2 max-w-[85%] group">
                                    {isMe && !message.isDeleted && (
                                        <div className={cn(
                                            "flex items-center gap-1 transition-opacity",
                                            (hoveredMessageId === message._id || showEmojiPicker === message._id) ? "opacity-100" : "opacity-0"
                                        )}>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowEmojiPicker(showEmojiPicker === message._id ? null : message._id)}
                                                    className={cn(
                                                        "p-1 hover:bg-zinc-200 rounded-full text-zinc-500 transition-colors",
                                                        showEmojiPicker === message._id && "bg-zinc-200"
                                                    )}
                                                >
                                                    <Smile className="h-4 w-4" />
                                                </button>

                                                {showEmojiPicker === message._id && (
                                                    <div
                                                        className="absolute bottom-full right-0 mb-2 z-50 bg-white border shadow-xl rounded-full p-1 flex gap-1 animate-in fade-in zoom-in duration-200"
                                                        onMouseLeave={() => setShowEmojiPicker(null)}
                                                    >
                                                        {commonEmojis.map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => {
                                                                    toggleReaction({ messageId: message._id, emoji });
                                                                    setShowEmojiPicker(null);
                                                                }}
                                                                className="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 rounded-full transition-colors text-lg"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => softDelete({ messageId: message._id })}
                                                className="p-1 hover:bg-red-50 rounded-full text-zinc-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}

                                    <div
                                        className={cn(
                                            "rounded-2xl px-4 py-2 text-sm shadow-sm relative",
                                            isMe
                                                ? "bg-blue-600 text-white rounded-tr-none"
                                                : "bg-white text-zinc-900 rounded-tl-none border border-zinc-100"
                                        )}
                                    >
                                        {message.isDeleted ? (
                                            <span className="italic opacity-70 text-xs">This message was deleted</span>
                                        ) : (
                                            <>
                                                {message.content}
                                                {message.reactions && message.reactions.length > 0 && (
                                                    <div className={cn(
                                                        "absolute -bottom-2 flex gap-1",
                                                        isMe ? "right-0" : "left-0"
                                                    )}>
                                                        {message.reactions.map((r: any) => (
                                                            <button
                                                                key={r.emoji}
                                                                onClick={() => toggleReaction({ messageId: message._id, emoji: r.emoji })}
                                                                className={cn(
                                                                    "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] shadow-sm border transition-colors",
                                                                    r.userIds.includes(meId)
                                                                        ? "bg-blue-50 border-blue-200 text-blue-600"
                                                                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                                                                )}
                                                            >
                                                                <span>{r.emoji}</span>
                                                                {r.userIds.length > 1 && <span>{r.userIds.length}</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {!isMe && !message.isDeleted && (
                                        <div className={cn(
                                            "flex items-center gap-1 transition-opacity",
                                            (hoveredMessageId === message._id || showEmojiPicker === message._id) ? "opacity-100" : "opacity-0"
                                        )}>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowEmojiPicker(showEmojiPicker === message._id ? null : message._id)}
                                                    className={cn(
                                                        "p-1 hover:bg-zinc-200 rounded-full text-zinc-500 transition-colors",
                                                        showEmojiPicker === message._id && "bg-zinc-200"
                                                    )}
                                                >
                                                    <Smile className="h-4 w-4" />
                                                </button>

                                                {showEmojiPicker === message._id && (
                                                    <div
                                                        className="absolute bottom-full left-0 mb-2 z-50 bg-white border shadow-xl rounded-full p-1 flex gap-1 animate-in fade-in zoom-in duration-200"
                                                        onMouseLeave={() => setShowEmojiPicker(null)}
                                                    >
                                                        {commonEmojis.map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => {
                                                                    toggleReaction({ messageId: message._id, emoji });
                                                                    setShowEmojiPicker(null);
                                                                }}
                                                                className="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 rounded-full transition-colors text-lg"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                    <MessageTimestamp timestamp={message._creationTime} />
                                    {isMe && !message.isDeleted && (
                                        <span>
                                            {isRead ? (
                                                <CheckCheck className="h-3 w-3 text-blue-500" />
                                            ) : (
                                                <Check className="h-3 w-3" />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}

                {typingUsers && typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 animate-pulse ml-1">
                        <div className="flex gap-0.5">
                            <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span>
                            {typingUsers.length === 1
                                ? `${typingUsers[0]} is typing...`
                                : `${typingUsers.length} people are typing...`}
                        </span>
                    </div>
                )}
            </div>

            {showScrollButton && (
                <button
                    onClick={() => scrollToBottom()}
                    className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border text-blue-600 transition-all hover:scale-110 active:scale-95"
                >
                    <ArrowDown className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}
