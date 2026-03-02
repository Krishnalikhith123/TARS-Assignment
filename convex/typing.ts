import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const setTyping = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q: any) => q.eq("externalId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const existing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.eq(q.field("userId"), me._id))
            .first();

        const expiresAt = Date.now() + 5000; // 5 seconds from now

        if (existing) {
            await ctx.db.patch(existing._id, { expiresAt });
        } else {
            await ctx.db.insert("typingIndicators", {
                conversationId: args.conversationId,
                userId: me._id,
                expiresAt,
            });
        }
    },
});

export const getTyping = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const typing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.gt(q.field("expiresAt"), now))
            .collect();

        const results = await Promise.all(
            typing.map(async (t) => {
                const user = await ctx.db.get(t.userId);
                return user?.name || "Someone";
            })
        );

        return results;
    },
});
