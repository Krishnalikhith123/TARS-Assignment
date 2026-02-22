"use client";

import { doc } from "prettier";
import { useEffect, useRef } from "react";
import { format, isToday, isYesterday, isThisYear } from "date-fns";

export function MessageTimestamp({ timestamp }: { timestamp: number }) {
    const date = new Date(timestamp);

    let formattedDate = "";
    if (isToday(date)) {
        formattedDate = format(date, "p"); // 2:34 PM
    } else if (isYesterday(date)) {
        formattedDate = `Yesterday, ${format(date, "p")}`;
    } else if (isThisYear(date)) {
        formattedDate = format(date, "MMM d, p"); // Feb 15, 2:34 PM
    } else {
        formattedDate = format(date, "MMM d, yyyy, p"); // Feb 15, 2024, 2:34 PM
    }

    return (
        <span className="text-[10px] text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
            {formattedDate}
        </span>
    );
}
