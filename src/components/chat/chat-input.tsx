"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

export function ChatInput({ conversationId }: { conversationId: Id<"conversations"> }) {
    const [content, setContent] = useState("");
    const sendMessage = useMutation((api as any).messages.send);
    const setTyping = useMutation((api as any).typing.setTyping);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContent(e.target.value);
        if (e.target.value.trim()) {
            setTyping({ conversationId });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        try {
            const text = content.trim();
            setContent("");
            await sendMessage({ conversationId, content: text });
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    return (
        <div className="border-t bg-white p-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={content}
                    onChange={handleContentChange}
                />
                <button
                    type="submit"
                    disabled={!content.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-opacity disabled:opacity-50"
                >
                    <Send className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
}
