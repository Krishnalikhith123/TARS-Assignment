"use client";

import { useQuery, useMutation } from "convex/react";
// @ts-ignore
import { api } from "../../../../convex/_generated/api";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { useParams, useRouter } from "next/navigation";
// @ts-ignore
import { Id } from "../../../../convex/_generated/dataModel";
import { ChevronLeft, MoreVertical, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/atoms";
import { cn } from "@/lib/utils";

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const chatId = params.id as Id<"conversations">;

    const me = useQuery(api.users.getMe);
    const conversations = useQuery(api.conversations.getMyConversations);
    const currentChat = conversations?.find((c: any) => c._id === chatId);

    if (!me || conversations === undefined) {
        return (
            <div className="flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-white">
                <Skeleton className="h-full w-full" />
            </div>
        );
    }

    return (
        <div className="flex h-[100dvh] w-full overflow-hidden bg-white">
            {/* Sidebar - hidden on mobile when chat is open */}
            <div className={cn(
                "hidden h-full md:block",
                !chatId && "block w-full md:w-80"
            )}>
                <Sidebar />
            </div>

            {/* Main Chat Area */}
            <div className={cn(
                "flex h-full flex-1 flex-col",
                !chatId && "hidden md:flex"
            )}>
                {currentChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center justify-between border-b bg-white p-4 h-16">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.push("/")}
                                    className="md:hidden"
                                >
                                    <ChevronLeft className="h-6 w-6 text-zinc-500" />
                                </button>
                                <img
                                    src={currentChat.otherUser.image}
                                    alt={currentChat.otherUser.name}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                                <div>
                                    <h2 className="text-sm font-semibold text-zinc-900">{currentChat.otherUser.name}</h2>
                                    <p className={cn(
                                        "text-[10px]",
                                        (currentChat.otherUser.lastSeen && Date.now() - currentChat.otherUser.lastSeen < 60000)
                                            ? "text-emerald-500 font-medium"
                                            : "text-zinc-500"
                                    )}>
                                        {(currentChat.otherUser.lastSeen && Date.now() - currentChat.otherUser.lastSeen < 60000)
                                            ? "online"
                                            : "offline"}
                                    </p>
                                </div>
                            </div>
                            <button className="text-zinc-400 hover:text-zinc-600">
                                <MoreVertical className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <ChatMessages conversationId={chatId} meId={me._id} />

                        {/* Input */}
                        <ChatInput conversationId={chatId} />
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center p-4">
                        <div className="bg-zinc-100 rounded-full p-6 mb-4">
                            <MessageSquare className="h-12 w-12 text-zinc-300" />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-800">Select a conversation</h2>
                        <p className="text-zinc-500 max-w-xs">Pick a friend from the sidebar or search to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

