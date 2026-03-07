const fs = require('fs');
const urls = [
    'https://autoembed.co/tv/tmdb/1399-1-1',
    'https://player.smashy.stream/tv/1399?s=1&e=1',
    'https://vidsrc.net/embed/tv?tmdb=1399&season=1&episode=1',
    'https://multiembed.mov/directstream.php?video_id=1399&tmdb=1&s=1&e=1'
];

async function check() {
    let out = '';
    for (const url of urls) {
        try {
            const res = await fetch(url, { redirect: 'follow' });
            const text = await res.text();
            const isNotFound = text.toLowerCase().includes('not found');

            out += `${url} - Status: ${res.status} - Final URL: ${res.url} - Has "not found": ${isNotFound}\n`;
        } catch (e) {
            out += `${url} - ERROR: ${e.message}\n`;
        }
    }
    fs.writeFileSync('test_sources_tv.log', out);
}
check();
