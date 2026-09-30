const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(fullPath));
        } else if (file.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walkDir('apps/web/src/app');
const fallback = `onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'https://userpic.codeforces.org/no-avatar.jpg'; }}`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;

    // regex to find src={var.avatar || '...'}
    // careful: stats?.avatar
    const regex = /src=\{([^}]+)\.avatar\s*\|\|\s*'https:\/\/userpic\.codeforces\.org\/no-avatar\.jpg'\}/g;
    
    if (regex.test(content)) {
        content = content.replace(regex, (match, p1) => {
            return `src={${p1}.avatar ? (${p1}.avatar.startsWith('//') ? \`https:\${${p1}.avatar}\` : ${p1}.avatar) : 'https://userpic.codeforces.org/no-avatar.jpg'} ${fallback}`;
        });
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(file, content, 'utf-8');
        console.log(`Updated ${file}`);
    }
});
