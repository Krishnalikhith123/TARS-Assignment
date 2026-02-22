import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getOrCreate = mutation({
    args: {
        otherUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q: any) => q.eq("externalId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        // Check if conversation already exists (either order)
        const existing = await ctx.db
            .query("conversations")
            .filter((q: any) =>
                q.or(
                    q.and(
                        q.eq(q.field("participantOne"), me._id),
                        q.eq(q.field("participantTwo"), args.otherUserId)
                    ),
                    q.and(
                        q.eq(q.field("participantOne"), args.otherUserId),
                        q.eq(q.field("participantTwo"), me._id)
                    )
                )
            )
            .first();

        if (existing) return existing._id;

        return await ctx.db.insert("conversations", {
            participantOne: me._id,
            participantTwo: args.otherUserId,
        });
    },
});

export const getMyConversations = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const me = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q: any) => q.eq("externalId", identity.subject))
            .unique();

        if (!me) return [];

        const conversations = await ctx.db
            .query("conversations")
            .filter((q: any) =>
                q.or(
                    q.eq(q.field("participantOne"), me._id),
                    q.eq(q.field("participantTwo"), me._id)
                )
            )
            .collect();

        const results = await Promise.all(
            conversations.map(async (conv: any) => {
                const otherUserId = conv.participantOne === me._id ? conv.participantTwo : conv.participantOne;
                const otherUser = await ctx.db.get(otherUserId);
                const lastMessage = conv.lastMessageId ? await ctx.db.get(conv.lastMessageId) : null;
                return {
                    ...conv,
                    otherUser,
                    lastMessage,
                };
            })
        );

        // Sort by last message time if available
        return results.sort((a, b) => (b.lastMessage?._creationTime || 0) - (a.lastMessage?._creationTime || 0));
    },
});
