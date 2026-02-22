import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.string(),
    externalId: v.string(), // Clerk ID
  }).index("by_externalId", ["externalId"]),
  
  conversations: defineTable({
    participantOne: v.id("users"),
    participantTwo: v.id("users"),
    lastMessageId: v.optional(v.id("messages")),
  }).index("by_participants", ["participantOne", "participantTwo"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    isDeleted: v.optional(v.boolean()),
    reactions: v.optional(v.array(v.object({
      emoji: v.string(),
      userIds: v.array(v.id("users")),
    }))),
  }).index("by_conversation", ["conversationId"]),
});
