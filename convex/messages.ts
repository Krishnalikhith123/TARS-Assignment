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

export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q: any) => q.eq("externalId", identity.subject))
            .unique();

        if (!me) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        const reactions = message.reactions || [];
        const reactionIndex = reactions.findIndex((r: any) => r.emoji === args.emoji);

        if (reactionIndex > -1) {
            const reaction = reactions[reactionIndex];
            const userIdIndex = reaction.userIds.indexOf(me._id);

            if (userIdIndex > -1) {
                // Remove reaction
                reaction.userIds.splice(userIdIndex, 1);
                if (reaction.userIds.length === 0) {
                    reactions.splice(reactionIndex, 1);
                }
            } else {
                // Add user to existing reaction
                reaction.userIds.push(me._id);
            }
        } else {
            // New reaction
            reactions.push({
                emoji: args.emoji,
                userIds: [me._id],
            });
        }

        await ctx.db.patch(args.messageId, { reactions });
    },
});

export const markRead = mutation({
    args: {
        conversationId: v.id("conversations"),
        messageId: v.id("messages"),
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
            .query("readReceipts")
            .withIndex("by_conversation_user", (q: any) =>
                q.eq("conversationId", args.conversationId).eq("userId", me._id)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                lastReadMessageId: args.messageId,
            });
        } else {
            await ctx.db.insert("readReceipts", {
                conversationId: args.conversationId,
                userId: me._id,
                lastReadMessageId: args.messageId,
            });
        }
    },
});

export const getReadReceipts = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("readReceipts")
            .withIndex("by_conversation_user", (q: any) => q.eq("conversationId", args.conversationId))
            .collect();
    },
});

export const search = query({
    args: {
        conversationId: v.id("conversations"),
        searchTerm: v.string(),
    },
    handler: async (ctx, args) => {
        if (!args.searchTerm.trim()) return [];

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
            .collect();

        return messages.filter((m: any) =>
            !m.isDeleted &&
            m.content.toLowerCase().includes(args.searchTerm.toLowerCase())
        );
    },
});

export const getUnreadCount = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return 0;

        const me = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q: any) => q.eq("externalId", identity.subject))
            .unique();

        if (!me) return 0;

        const lastRead = await ctx.db
            .query("readReceipts")
            .withIndex("by_conversation_user", (q: any) =>
                q.eq("conversationId", args.conversationId).eq("userId", me._id)
            )
            .first();

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
            .collect();

        if (!lastRead) return messages.filter((m: any) => m.senderId !== me._id).length;

        const lastReadMsg = await ctx.db.get(lastRead.lastReadMessageId);
        if (!lastReadMsg) return 0;

        return messages.filter((m: any) =>
            m.senderId !== me._id &&
            m._creationTime > lastReadMsg._creationTime
        ).length;
    },
});
