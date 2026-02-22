"use client";

import { useQuery } from "convex/react";
// @ts-ignore
import { api } from "../../convex/_generated/api";
import { Sidebar } from "@/components/sidebar/sidebar";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const me = useQuery(api.users.getMe);
  const conversations = useQuery(api.conversations.getMyConversations);

  if (!me || conversations === undefined) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-zinc-500">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white">
      {/* Sidebar */}
      <div className="flex h-full w-full md:w-80 border-r">
        <Sidebar />
      </div>

      {/* Main Empty Area (Desktop) */}
      <div className="hidden flex-1 flex-col items-center justify-center bg-zinc-50 text-center md:flex">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100 flex flex-col items-center max-w-sm">
          <div className="bg-blue-50 rounded-full p-6 mb-6">
            <MessageSquare className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Welcome, {me.name}!</h2>
          <p className="text-zinc-500 mb-8">
            Select a conversation from the sidebar or search for someone new to start messaging.
          </p>
          <div className="flex gap-2 w-full">
            <div className="flex-1 rounded-lg bg-zinc-100 p-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase mb-1">Total Chats</p>
              <p className="text-xl font-bold text-zinc-800">{conversations.length}</p>
            </div>
            <div className="flex-1 rounded-lg bg-zinc-100 p-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase mb-1">Status</p>
              <p className="text-xl font-bold text-green-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-600" /> Online
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
