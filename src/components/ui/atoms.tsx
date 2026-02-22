import { cn } from "@/lib/utils";

export function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-zinc-200", className)}
            {...props}
        />
    );
}

export function Badge({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-xs font-semibold text-white",
                className
            )}
        >
            {children}
        </span>
    );
}
