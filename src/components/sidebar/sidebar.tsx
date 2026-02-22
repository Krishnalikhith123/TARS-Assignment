"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { Search, MessageSquare, UserPlus } from "lucide-react";
import { Skeleton } from "../ui/atoms";
import { cn } from "@/lib/utils";
import { useRouter, useParams } from "next/navigation";

export function Sidebar() {
    const [search, setSearch] = useState("");
    const users = useQuery(api.users.getUsers, { search });
    const conversations = useQuery(api.conversations.getMyConversations);
    const router = useRouter();
    const params = useParams();
    const getOrCreateConversation = useMutation(api.conversations.getOrCreate);

    const currentChatId = params?.id;

    const handleStartConversation = async (userId: any) => {
        try {
            const convId = await getOrCreateConversation({ otherUserId: userId });
            setSearch("");
            router.push(`/chat/${convId}`);
        } catch (error) {
            console.error("Failed to start conversation:", error);
        }
    };

    return (
        <div className="flex h-full w-full flex-col border-r bg-zinc-50 md:w-80">
            <div className="flex items-center justify-between border-b p-4">
                <h1 className="text-xl font-bold text-zinc-800">Tars Chat</h1>
                <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
            </div>

            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full rounded-full border bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
                {search ? (
                    <div className="space-y-1 pb-4">
                        <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">People</h2>
                        {users === undefined ? (
                            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
                        ) : users.length === 0 ? (
                            <p className="px-3 py-4 text-sm text-zinc-500">No users found.</p>
                        ) : (
                            users.map((user: any) => (
                                <button
                                    key={user._id}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-zinc-200/50"
                                    onClick={() => handleStartConversation(user._id)}
                                >
                                    <img src={user.image} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="truncate font-medium text-zinc-900">{user.name}</p>
                                        <p className="truncate text-xs text-zinc-500">{user.email}</p>
                                    </div>
                                    <UserPlus className="h-4 w-4 text-blue-500" />
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-1 pb-4">
                        <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Conversations</h2>
                        {conversations === undefined ? (
                            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <MessageSquare className="mb-2 h-8 w-8 text-zinc-300" />
                                <p className="text-sm text-zinc-500">No chats yet.<br />Search users to start talking!</p>
                            </div>
                        ) : (
                            conversations.map((conv: any) => (
                                <button
                                    key={conv._id}
                                    className={cn(
                                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-200/50",
                                        currentChatId === conv._id && "bg-white shadow-sm ring-1 ring-zinc-200"
                                    )}
                                    onClick={() => router.push(`/chat/${conv._id}`)}
                                >
                                    <img src={conv.otherUser.image} alt={conv.otherUser.name} className="h-10 w-10 rounded-full object-cover" />
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <p className="truncate font-medium text-zinc-900">{conv.otherUser.name}</p>
                                            {conv.lastMessage && (
                                                <span className="text-[10px] text-zinc-400">
                                                    {new Date(conv.lastMessage._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="truncate text-xs text-zinc-500">
                                            {conv.lastMessage?.content || "Start a conversation"}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
