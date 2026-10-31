import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isLocalMode } from "@/lib/dataMode";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    // Yerel modda OAuth yok; geri dönüş adresi doğrudan ana sayfaya gider.
    if (code && !isLocalMode) {
        // Next 16: cookies() asenkron.
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: (toSet) => {
                        for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
                    },
                },
            }
        );
        await supabase.auth.exchangeCodeForSession(code);
    }

    return NextResponse.redirect(new URL("/", requestUrl.origin));
}
