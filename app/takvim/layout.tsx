import type { Metadata } from "next";

export const metadata: Metadata = { title: "Takvim" };

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
