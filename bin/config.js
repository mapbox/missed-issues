const path = require('path');
const fs = require('fs');
const dotenvFile = path.join(__dirname, '..', '.env');

const envFlags = require('./flag-envs.json');
var envValues;
try {
  envValues = fs
    .readFileSync(dotenvFile)
    .toString()
    .split('\n')
    .filter(l => l !== '')
    .map(l => l.split('='))
    .reduce((m, v) => {
      m[v[0]] = v[1];
      return m;
    }, {});
} catch (err) {
  envValues = {};
}

if (process.argv.length === 3) {
  // PRINT CONFIG
  require('dotenv').load(dotenvFile);

  console.log(`Current configuration`); // eslint-disable-line no-console
  Object.keys(envFlags).forEach(flag => {
    var env = envFlags[flag];
    var val = envValues[env] || process.env[env] || '<NOT SET>';
    console.log(`\t\t${flag}: ${val}`); // eslint-disable-line no-console
  });
  process.exit();
}

var flag = process.argv[3];
var value = process.argv[4];

if (envFlags[flag] === undefined) {
  console.error('Unknown flag: ' + flag); // eslint-disable-line no-console
  process.exit(1);
}

if (value === undefined) {
  console.error('Value must be provided to set a flag'); // eslint-disable-line no-console
  process.exit(1);
}

envValues[envFlags[flag]] = value;

var fileStr = Object.keys(envValues).reduce((m, k) => {
  return `${m}${k}=${envValues[k]}\n`;
}, '');

fs.writeFileSync(dotenvFile, fileStr);
