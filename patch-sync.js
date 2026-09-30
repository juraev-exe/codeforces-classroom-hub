const fs = require('fs');

const storePath = 'apps/web/src/lib/server-store.ts';
let store = fs.readFileSync(storePath, 'utf-8');

// The actual indentation is 4 spaces
const target = `async getTeacherDashboard(): Promise<any> {\n    const handle = 'AbubakrJ';`;

const replacement = `async getTeacherDashboard(): Promise<any> {
    // Auto-sync all students to pull fresh submissions from Codeforces
    const allStudents = this.getStudents();
    await Promise.all(
      allStudents.map((s) => this.syncStudent(s.id).catch(() => null))
    );

    const handle = 'AbubakrJ';`;

if (store.includes(target)) {
  store = store.replace(target, replacement);
  fs.writeFileSync(storePath, store, 'utf-8');
  console.log('✓ Added auto-sync to getTeacherDashboard');
} else {
  console.error('✗ Target not found');
  // Show actual text around getTeacherDashboard
  const idx = store.indexOf('async getTeacherDashboard');
  console.log('Actual bytes around match:');
  const snippet = store.substring(idx, idx + 100);
  for (let i = 0; i < snippet.length; i++) {
    if (snippet.charCodeAt(i) < 32) {
      process.stdout.write(`[${snippet.charCodeAt(i)}]`);
    } else {
      process.stdout.write(snippet[i]);
    }
  }
  console.log();
}
