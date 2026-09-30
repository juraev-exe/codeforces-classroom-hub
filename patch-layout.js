const fs = require('fs');
const path = 'apps/web/src/app/layout.tsx';
let content = fs.readFileSync(path, 'utf-8');

content = content.replace('<html lang="en" className="dark">', '<html lang="en" className="dark" style={{ fontSize: "14.5px" }}>');

fs.writeFileSync(path, content, 'utf-8');
console.log('Done');
