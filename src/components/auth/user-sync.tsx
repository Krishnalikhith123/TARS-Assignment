"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
// @ts-ignore
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";

export function UserSync() {
    const { user } = useUser();
    const storeUser = useMutation(api.users.store);

    useEffect(() => {
        if (!user) return;

        const syncUser = async () => {
            try {
                await storeUser({
                    name: user.fullName || user.username || "Anonymous",
                    email: user.emailAddresses[0]?.emailAddress || "",
                    image: user.imageUrl || "",
                    externalId: user.id,
                });
            } catch (error) {
                console.error("Error syncing user:", error);
            }
        };

        syncUser();
    }, [user, storeUser]);

    return null;
}
