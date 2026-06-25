const fs = require('fs');
const path = require('path');

const defaultApiBase = 'https://eventosvivos-api.onrender.com';

function normalizeApiBase(rawInput) {
  let value = (rawInput || defaultApiBase).trim().replace(/\/$/, '');

  if (!/^https?:\/\//i.test(value)) {
    value = value.split(':')[0];
    if (!value.includes('.')) {
      value = `${value}.onrender.com`;
    }
    value = `https://${value}`;
  }

  return value;
}

const rawBase = normalizeApiBase(process.env.API_URL);
const apiUrl = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;

const targetPath = path.join(__dirname, '../src/environments/environment.production.ts');
fs.writeFileSync(targetPath, content, 'utf8');
console.log(`API URL for production build: ${apiUrl}`);
