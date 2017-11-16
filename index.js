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

  if (typeof opts['max-issues'] !== 'number') {
    return Promise.reject(
      new Error('opts.max-issues must be a number, use 0 for all')
    );
  }

  var teamInfo = null;
  var teamMembers = null;
  var teamIssues = null;
  return checkOrg(opts)
    .then(() =>
      getTeamId(opts).then(ti => {
        teamInfo = ti;
        logger('Team: ' + ti.name);
      })
    )
    .then(() =>
      getTeamMembers(opts, teamInfo).then(mem => {
        teamMembers = mem.filter(mem => opts.nonmembers.indexOf(mem) === -1);
        logger('Num Members: ' + mem.length);
      })
    )
    .then(() =>
      findIssues(opts).then(issues => {
        teamIssues = issues.filter(
          iss => opts['ignore-repos'].indexOf(iss.repo) === -1
        );
        logger('Num Issues: ' + issues.length);
      })
    )
    .then(() => fillInComments(opts, teamIssues)) //mutates teamIssues
    .then(() => (teamIssues = filterIssues(teamIssues, teamMembers)));
};

function logger(msg) {
  if (process.env.DEBUG === 'missed-issues') {
    console.log('[missed-issues] ' + msg); // eslint-disable-line no-console
  }
}

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
  var count = 0;
  return Promise.all(
    issues.map(t => {
      return getComments(opts, t).then(c => {
        t.comments = c;
        count += c.length;
        return t;
      });
    })
  ).then(() => logger('Num Comments: ' + count));
}

function getComments(opts, ticket, page) {
  // TODO: use `rel="last"` to do reverse paging and be able to quickly exit
  page = page || 1;
  var url = `repos/${opts.org}/${ticket.repo}/issues/${
    ticket.id
  }/comments?page=${page}`;
  return safeGh(url, { token: opts.token }).then(resp => {
    var link = resp.headers.link || '';
    var hasNext = link.indexOf('rel="next"') !== -1;
    var comments = resp.body.map(c => {
      return {
        user: c.user.login,
        mentionsTeam: c.body.indexOf(`@${opts.org}/${opts.team}`) !== -1
      };
    });
    if (hasNext) {
      return getComments(opts, ticket, page, comments.length).then(c =>
        comments.concat(c)
      );
    }
    return comments;
  });
}

function findIssues(opts, page, numBefore) {
  page = page || 1;
  numBefore = numBefore || 0;
  var q = `team:${opts.org}/${opts.team} state:open updated:>=${opts.from}`;
  return safeGh(`search/issues?q=${q}&page=${page}&sort=updated&order=desc`, {
    token: opts.token
  }).then(resp => {
    var link = resp.headers.link || '';
    var hasNext = link.indexOf('rel="next"') !== -1;
    var issues = resp.body.items.map(i => {
      var repoParts = i.repository_url.split('/');
      var urlParts = i.html_url.split('/');
      return {
        id: i.number,
        repo: repoParts[repoParts.length - 1],
        url: i.html_url,
        title: i.title,
        user: i.user.login,
        type: urlParts[urlParts.length - 2]
      };
    });
    var numNow = numBefore + issues.length;
    if (hasNext && numNow < opts['max-issues']) {
      return findIssues(opts, page + 1, numNow).then(next =>
        issues.concat(next).slice(0, opts['max-issues'])
      );
    }
    return issues.slice(0, opts['max-issues']);
  });
}

function safeGh(url, opts) {
  return ghGot(url, opts).catch(resp => {
    if (
      resp.headers.status === '403 Forbidden' &&
      resp.headers['retry-after']
    ) {
      console.error('[missed-issues] warning: you are being ratelimited'); // eslint-disable-line no-console
      return wait(resp.headers['retry-after']).then(() => safeGh(url, opts));
    }
    throw resp;
  });
}

function wait(seconds) {
  return new Promise(function(resolve) {
    setTimeout(resolve, seconds * 1000);
  });
}

function checkOrg(opts) {
  return safeGh(`orgs/${opts.org}`, { token: opts.token }).then(() => {
    return null;
  });
}

function getTeamMembers(opts, teamInfo) {
  return safeGh(`teams/${teamInfo.id}/members`, { token: opts.token }).then(
    resp => {
      return resp.body.map(u => u.login);
    }
  );
}

function getTeamId(opts, page) {
  page = page || 1;
  return safeGh(`orgs/${opts.org}/teams?page=${page}`, {
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
