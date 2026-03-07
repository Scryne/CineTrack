const fs = require('fs');

const urls = [
    'https://vidsrc.cc/v2/embed/movie/550',
    'https://vidsrc.me/embed/movie?tmdb=550',
    'https://vidlink.pro/movie/550',
    'https://www.2embed.cc/embed/550'
];

async function check() {
    let out = '';
    for (const url of urls) {
        try {
            const res = await fetch(url, { redirect: 'follow' });
            const xFrame = res.headers.get('x-frame-options') || 'none';
            const csp = res.headers.get('content-security-policy') || 'none';
            out += `${url} - Status: ${res.status} (${res.statusText}) - Final URL: ${res.url} - X-Frame: ${xFrame} - CSP: ${csp}\n`;
        } catch (e) {
            out += `${url} - ERROR: ${e.message}\n`;
        }
    }
    fs.writeFileSync('test_sources_alt.log', out);
}

check();
