# Missed Issues

A CLI tool for finding tickets that mention a team by no one has responded to from the team.

`missed-issues --org mapbox --team teamname`

This will list all issues in the mapbox org that mention `@mapbox/teamname` where no member of that team has replied to the issue since the mention.

## Flags

- `--max-issues`: the max number of issues to return in the search result before filtering. Defaults to 100.

