const fs = require('fs');
const path = require('path');

const defaultApiBase = 'https://eventosvivos-api.onrender.com';
const rawBase = (process.env.API_URL || defaultApiBase).replace(/\/$/, '');
const apiUrl = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;

const targetPath = path.join(__dirname, '../src/environments/environment.production.ts');
fs.writeFileSync(targetPath, content, 'utf8');
console.log(`API URL for production build: ${apiUrl}`);
