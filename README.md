# Missed Issues

A CLI tool for finding issues that mention a team and no one from the team has responded to the issue.

`missed-issues --org mapbox --team teamname --token github_token`

This will list all issues in the mapbox org that mention `@mapbox/teamname` where no member of that team has replied to the issue since the mention.

## Flags

**Required**

- `--org`: the name of the org you want to search.
- `--team`: the name of the team you are checking into. This MUST not contain the name of the org.
- `--token`: a GitHub token with `read:org, repo` access

**Optional**

- `--from`: the start date of your search range. All issues returned will have been edited on or after this date. Defaults to one week ago.
- `--ignore-repos` a comma-separated list of repos that you wish to exclude from your search results. These are excluding via filtering and will thus still affect your max-issues number.
- `--max-issues`: the max number of issues to get before filtering to help avoid long requests. Defaults to 100. That said, hitting this max is bad for your results.
- `--nonmembers`: a comma-separated list of user logins who should not be used to count a ticket as replied too.

## Environment Variables

`missed-issues` allows you to use environment variables to set unprovided flags. This is very helpful if you are running this for a single team or a single org and it lets you not paste your GitHub token into your terminal over and over again.

Below is a list of env vars `missed-issues` supports. The value of the env var is the flag the key will set.

```
GITHUB_TOKEN=token
MISSED_ISSUES_ORG=org
MISSED_ISSUES_TEAM=team
MISSED_ISSUES_IGNORE_REPOS=ignore-repos
MISSED_ISSUES_NON_MEMBERS=nonmembers
```

**.env files**

If you have a `.env` file in the folder returned by `which missed-issues` then `missed-issues` will auto load these env vars on every run.
