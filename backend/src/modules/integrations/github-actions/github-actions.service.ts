export function workflowYaml(apiUrl:string){return `name: BugFixAI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npx bugfixai analyze --api ${apiUrl}`;}
