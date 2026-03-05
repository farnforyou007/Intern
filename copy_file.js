const fs = require('fs');
const path = require('path');
const base = path.join('d:', 'สหกิจ', 'internship-system', 'src', 'app');
const src = path.join(base, 'teacher', 'subjects', 'page.tsx');
const dstDir = path.join(base, 'admin', 'evaluations');
const dst = path.join(dstDir, 'page.tsx');
try {
    fs.mkdirSync(dstDir, { recursive: true });
    fs.copyFileSync(src, dst);
    console.log('SUCCESS: ' + fs.statSync(dst).size + ' bytes');
} catch (e) {
    console.error('ERROR:', e.message);
}
