import type { NextRequest } from 'next/server';
import { handleSubtitlesRequest } from '@/lib/subtitlesServer';

/** OpenSubtitles arama ve indirme vekili; ayrıntı lib/subtitlesServer.ts'te. */
export function GET(request: NextRequest) {
    return handleSubtitlesRequest(request.url);
}
