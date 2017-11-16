#!/usr/bin/env node
const path = require('path');
require('dotenv').load(path.join(__dirname, '..', '.env'));
const missedIssues = require('../index');

var envFlags = {
  token: 'GITHUB_TOKEN',
  team: 'MISSED_ISSUES_TEAM',
  org: 'MISSED_ISSUES_ORG',
  'ignore-repos': 'MISSED_ISSUES_IGNORE_REPOS',
  nonmembers: 'MISSED_ISSUES_NON_MEMBERS'
};

// PROCESS ARGS
const opts = process.argv.slice(2).reduce((m, v, i, a) => {
  if (v[0] !== '-') return m;
  if (v[1] !== '-' && v.indexOf('=') === -1)
    throw new Error(`Invalid argument '${v}'`);
  var args = v.replace(/^[-]*/g, '').split('=');
  if (args[1] === undefined) args[1] = a[i + 1];
  m[args[0]] = args[1];
  return m;
}, {});

// SET ENV VALUES
Object.keys(envFlags).forEach(flag => {
  var envVal = process.env[envFlags[flag]];
  if (opts[flag] === undefined && envVal) {
    opts[flag] = envVal;
  }
});

// SET DEFAULTS
opts['ignore-repos'] = opts['ignore-repos']
  ? opts['ignore-repos'].split(',')
  : [];

if (opts['max-issues']) opts['max-issues'] = parseInt(opts['max-issues']);
opts['max-issues'] = opts['max-issues'] || 100;

var ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
var defaultAfter = new Date(Date.now() - ONE_WEEK).toISOString().split('T')[0];
opts.from = opts.from || defaultAfter;

opts.nonmembers = opts.nonmembers ? opts.nonmembers.split(',') : [];

// RUN
missedIssues(opts)
  .then(issues => {
    var lastRepo = null;
    issues
      .sort((a, b) => {
        if (a.repo === b.repo) return a.id - b.id;
        return a.repo < b.repo ? -1 : 1;
      })
      .map(iss => {
        if (lastRepo !== iss.repo) {
          console.log(`${lastRepo === null ? '' : '\n'}## ${iss.repo}\n`); // eslint-disable-line no-console
          lastRepo = iss.repo;
        }
        console.log(`- [ ] [#${iss.id} - ${iss.title}](${iss.url})`); // eslint-disable-line no-console
      });
  })
  .catch(err => {
    console.error(err.message); // eslint-disable-line no-console
    process.exit(1);
  });
