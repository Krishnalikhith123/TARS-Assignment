import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const store = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        image: v.string(),
        externalId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q: any) => q.eq("externalId", args.externalId))
            .unique();

        if (user !== null) {
            return await ctx.db.patch(user._id, {
                name: args.name,
                image: args.image,
            });
        }

        return await ctx.db.insert("users", {
            name: args.name,
            email: args.email,
            image: args.image,
            externalId: args.externalId,
        });
    },
});

export const getUsers = query({
    args: { search: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const users = await ctx.db.query("users").collect();

        // Filter out the current user and apply search if provided
        return users.filter((u: any) =>
            u.externalId !== identity.subject &&
            (!args.search || u.name.toLowerCase().includes(args.search.toLowerCase()))
        );
    },
});

export const getMe = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("users")
            .withIndex("by_externalId", (q: any) => q.eq("externalId", identity.subject))
            .unique();
    },
});
