import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "İzle - CineTrack",
};

export default function WatchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black">
            {/* 
        This layout overrides the default layout's padding and constraints 
        to allow the video player to be full width or have specific watch-page styling 
        without the Navbar affecting the top space.
        
        The Navbar is hidden here because the user wants a minimal top bar in the page itself.
      */}
            {children}
        </div>
    );
}
