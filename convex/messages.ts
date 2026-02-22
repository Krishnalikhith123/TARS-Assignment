import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
    },
    handler: async (ctx: any, args: any) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q: any) => q.eq("externalId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: me._id,
            content: args.content,
        });

        await ctx.db.patch(args.conversationId, {
            lastMessageId: messageId,
        });

        return messageId;
    },
});

export const list = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx: any, args: any) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
            .collect();
    },
});

export const softDelete = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx: any, args: any) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q: any) => q.eq("externalId", identity.subject))
            .unique();

        const message = await ctx.db.get(args.messageId);
        if (!message || message.senderId !== me?._id) {
            throw new Error("Unauthorized or message not found");
        }

        await ctx.db.patch(args.messageId, {
            isDeleted: true,
        });
    },
});
