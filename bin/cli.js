#!/usr/bin/env node
const path = require('path');
require('dotenv').load(path.join(__dirname, '..', '.env'));
const unacknowledgedTeamMentions = require('../index');

var envFlags = {
  token: 'GITHUB_TOKEN',
  team: 'GITHUB_TEAM',
  org: 'GITHUB_ORG'
}

const opts = process.argv.slice(2).reduce((m, v, i, a) => {
  if (v[0] !== '-') return m;
  if (v[1] !== '-' && v.indexOf('=') === -1) throw new Error(`Invalid argument '${v}'`);
  var args = v.replace(/-/g, '').split('=');
  if (args[1] === undefined) args[1] = a[i+1];
  m[args[0]] = args[1];
  return m;
}, {});

Object.keys(envFlags).forEach(flag => {
  var envVal = process.env[envFlags[flag]];
  if (opts[flag] === undefined && envVal) {
    opts[flag] = envVal;
  }
})

unacknowledgedTeamMentions(opts).then(resp => console.log(resp)).catch(err => {
  console.error(err.message);
  process.exit(1);
});
