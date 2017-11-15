const ghGot = require('gh-got');

module.exports = function(opts) {
  if (opts.org === undefined) {
    return Promise.reject(new Error('opts.org must be set'));
  }
  if (opts.team === undefined) {
    return Promise.reject(new Error('opts.team must be set'));
  }
  if (opts.token === undefined) {
    return Promise.reject(new Error('opts.token must be set'));
  }

  var teamInfo = null;
  var teamMembers = null;
  var teamIssues = null;
  return checkOrg(opts)
    .then(() => getTeamId(opts).then(ti => (teamInfo = ti)))
    .then(() => getTeamMembers(opts, teamInfo).then(mem => (teamMembers = mem)))
    .then(() => findIssues(opts).then(issues => (teamIssues = issues)))
    .then(() => fillInComments(opts, teamIssues)) //mutates teamIssues
    .then(() => (teamIssues = filterIssues(teamIssues, teamMembers)));
};

function filterIssues(issues, members) {
  return issues.filter(t => {
    var lastMention = t.comments.reduce((m, c, i) => {
      if (c.mentionsTeam) return i;
      return m;
    }, -1);

    // -2 means no member has ever been on this ticket
    // -1 means the creator of the ticket was a member
    // 0 and up means a member has commented
    var lastReply = t.comments.reduce((m, c, i) => {
      if (members.indexOf(c.user) === -1) return m;
      return i;
    }, members.indexOf(t.user) === -1 ? -2 : -1);

    return lastMention > lastReply;
  });
}

function fillInComments(opts, issues) {
  return Promise.all(
    issues.map(t => {
      return getComments(opts, t).then(c => {
        t.comments = c;
        return t;
      });
    })
  );
}

function getComments(opts, ticket, page) {
  page = page || 1;
  var url = `repos/${opts.org}/${ticket.repo}/issues/${
    ticket.id
  }/comments?page=${page}`;
  return ghGot(url, { token: opts.token }).then(resp => {
    var link = resp.headers.link || '';
    var hasNext = link.indexOf('rel="next"') !== -1;
    var comments = resp.body.map(c => {
      return {
        user: c.user.login,
        mentionsTeam: c.body.indexOf(`@${opts.org}/${opts.team}`) !== -1
      };
    });
    if (hasNext) {
      return getComments(opts, ticket, page).then(c => comments.concat(c));
    }
    return comments;
  });
}

function findIssues(opts, page) {
  page = page || 1;
  var q = `team:${opts.org}/${opts.team} state:open`;
  return ghGot(`search/issues?q=${q}&page=${page}`, {
    token: opts.token
  }).then(resp => {
    var link = resp.headers.link || '';
    var hasNext = link.indexOf('rel="next"') !== -1;
    var issues = resp.body.items.map(i => {
      var repoParts = i.repository_url.split('/');
      return {
        id: i.number,
        repo: repoParts[repoParts.length - 1],
        url: i.html_url,
        title: i.title,
        user: i.user.login
      };
    });
    if (hasNext) {
      return findIssues(opts, page + 1).then(next => issues.concat(next));
    }
    return issues;
  });
}

function checkOrg(opts) {
  return ghGot(`orgs/${opts.org}`, { token: opts.token }).then(() => {
    return null;
  });
}

function getTeamMembers(opts, teamInfo) {
  return ghGot(`teams/${teamInfo.id}/members`, { token: opts.token }).then(
    resp => {
      return resp.body.map(u => u.login);
    }
  );
}

function getTeamId(opts, page) {
  page = page || 1;
  return ghGot(`orgs/${opts.org}/teams?page=${page}`, {
    token: opts.token
  }).then(resp => {
    var link = resp.headers.link || '';
    var hasNext = link.indexOf('rel="next"') !== -1;
    var matches = resp.body.filter(t => t.slug === opts.team);
    if (matches.length) return matches[0];
    if (hasNext) return getTeamId(opts, page + 1);
    throw new Error('Cannot find team in the org');
  });
}
