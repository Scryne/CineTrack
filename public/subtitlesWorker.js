self.addEventListener('message', (e) => {
    const { vttText } = e.data;
    const cues = [];
    const blocks = vttText.replace(/\r\n/g, '\n').split('\n\n');

    const parseTimestamp = (ts) => {
        const parts = ts.split(':');
        if (parts.length === 3) {
            return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
        } else if (parts.length === 2) {
            return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
        }
        return NaN;
    };

    for (const block of blocks) {
        const lines = block.trim().split('\n');
        let timeLineIdx = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('-->')) {
                timeLineIdx = i;
                break;
            }
        }
        if (timeLineIdx === -1) continue;

        const timeParts = lines[timeLineIdx].split('-->');
        if (timeParts.length < 2) continue;

        const startTime = parseTimestamp(timeParts[0].trim());
        const endTime = parseTimestamp(timeParts[1].trim().split(' ')[0]);

        if (isNaN(startTime) || isNaN(endTime)) continue;

        const text = lines.slice(timeLineIdx + 1).join('\n').trim();
        if (text) {
            cues.push({ startTime, endTime, text });
        }
    }

    self.postMessage({ cues });
});
