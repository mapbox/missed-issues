# Missed Issues

A CLI tool for finding issues that mention a team and no one from the team has responded to the issue.

This will list all issues in the mapbox org that mention `@mapbox/teamname` where no member of that team has replied to the issue since the mention. To help cut down on commenting for commenting's sake, it also accepts 👍 on the original post as acknowledgement of the issue if no comments below mention the team.

```sh
> missed-issues --org mapbox --team teamname --token github_token
```

**Possible output**

```md
## check-file-dependencies

- [ ] [#1123 - Consider evaluating expressions](https://github.com/mapbox/check-file-dependencies/issues/new)

## missed-issues

- [ ] [#42 - Document the node module interface](https://github.com/mapbox/missed-issues/issues/new)
```

## Usage

`npm install @mapbox/missed-issues -g`

Go to [Personal access tokens](https://github.com/settings/tokens) in GitHub and create a token with `read:org` and `repo` access and than run the follow command. This will store your token in a config file so that you don't have to type `--token [redacted]` every time you run `missed-issues`.

```
missed-issues config token [redacted]`
```

## Command Options

**Required**

- `--org`: the name of the org you want to search.
- `--team`: the name of the team you are checking into. This MUST not contain the name of the org.
- `--token`: a GitHub token with `read:org, repo` access

**Optional**

- `--from`: the start date of your search range. All issues returned will have been edited on or after this date. Defaults to one week ago. `from` must either be a `YYYY-MM-DD` string such as `2017-11-16` or a `###d` string suck as `21d`. The `###d` format allows for "days from now".
- `--ignore-repos` a comma-separated list with no spaces of repos that you wish to exclude from your search results. These are excluding via filtering and will thus still affect your max-issues number. (eg: `missed-issues,mapbox-gl-draw`).
- `--max-issues`: the max number of issues to get before filtering to help avoid long requests. Defaults to 100. That said, hitting this max is bad for your results.
- `--nonmembers`: a comma-separated list of user logins who should not be used to count a ticket as replied too.

## Configuration

`missed-issues` allows you to configure defaults for unprovided flags. This is very helpful if you are running this for a single team or a single org and it lets you not paste your GitHub token into your terminal over and over again.

Configuration is powered by environment variables and can thus be set via your `.profile` or simular shell setup tool.

Below is a list of env vars `missed-issues` supports. The value of the env var is the flag the key will set.

```
GITHUB_TOKEN=token
MISSED_ISSUES_ORG=org
MISSED_ISSUES_TEAM=team
MISSED_ISSUES_IGNORE_REPOS=ignore-repos
MISSED_ISSUES_NON_MEMBERS=nonmembers
```

### Viewing Configuration via the CLI

`missed-issues config`

This will print out of flags as set via environment variables and config.

```sh
Current configuration
		token: fake-token
		team: just-a-team
		org: just-an-org
		ignore-repos: <NOT SET>
		nonmembers: <NOT SET>
```

`<NOT SET>` indicates that the value will not be set via the config or current environment variables.

## Setting Configuration via the CLI

`missed-issues config <flag> <value>`

This commands sets the value of a flag perminitly in your `missed-issues` config file.

**flags**

The below flags can be stored

- token
- org
- team
- ignore-repos
- nonmembers

**values**

All values should match that desribed in the flags section but validation is not provided at this step. The value must be set. To unset a flag try `missed-issues config <flag> ""`.


