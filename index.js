const ghGot = require('gh-got');

module.exports = function(opts) {
  if (opts.org === undefined) return Promise.reject(new Error('opts.org must be set'));
  if (opts.team === undefined) return Promise.reject(new Error('opts.team must be set'));
  if (opts.token === undefined) return Promise.reject(new Error('opts.token must be set'));

  var teamInfo = null;
  return checkOrg(opts)
    .then(() => getTeamId(opts).then(ti => teamInfo = ti))
    .then(() => getTeamMembers(opts, teamInfo).then(mem => teamMembers = mem));
  // find all tickets in org that mention the team
  // did a team member reply or react after that comment?
}

function checkOrg(opts) {
  return ghGot(`orgs/${opts.org}`, {token: opts.token}).then(resp => {
    return null;
  });
}

function getTeamMembers(opts, teamInfo) {
  return ghGot(`teams/${teamInfo.id}/members`, {token: opts.token}).then(resp => {
    return resp.body.map(u => u.login);
  });
}

function getTeamId(opts, page) {
  page = page || 1;
  return ghGot(`orgs/${opts.org}/teams?page=${page}`, {token: opts.token}).then(resp => {
    var link = resp.headers.link || '';
    var hasNext = link.indexOf('rel="next"') !== -1;
    var matches = resp.body.filter(t => t.slug === opts.team);
    console.log(matches);
    if (matches.length) return matches[0];
    if (hasNext) return getTeamId(opts, page+1);
    throw new Error('Cannot find team in the org');
  });
}
