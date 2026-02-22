"use client";

import { useQuery } from "convex/react";
// @ts-ignore
import { api } from "../../../convex/_generated/api";
// @ts-ignore
import { Id } from "../../../convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { MessageTimestamp } from "./message-timestamp";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";

export function ChatMessages({ conversationId, meId }: { conversationId: Id<"conversations">; meId: Id<"users"> }) {
    const messages = useQuery(api.messages.list, { conversationId });
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

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

    return (
        <div className="relative flex-1 overflow-hidden bg-zinc-50">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto p-4 space-y-4"
            >
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <p className="text-sm text-zinc-500">No messages yet. Say hello!</p>
                    </div>
                ) : (
                    messages.map((message: any) => {
                        const isMe = message.senderId === meId;
                        return (
                            <div
                                key={message._id}
                                className={cn(
                                    "group flex flex-col gap-1",
                                    isMe ? "items-end" : "items-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                        isMe
                                            ? "bg-blue-600 text-white rounded-tr-none"
                                            : "bg-white text-zinc-900 rounded-tl-none border border-zinc-100"
                                    )}
                                >
                                    {message.isDeleted ? (
                                        <span className="italic opacity-70 text-xs">This message was deleted</span>
                                    ) : (
                                        message.content
                                    )}
                                </div>
                                <MessageTimestamp timestamp={message._creationTime} />
                            </div>
                        );
                    })
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
