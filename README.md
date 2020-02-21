# Package Template

[![Greenkeeper badge](https://badges.greenkeeper.io/5app/package-template.svg)](https://greenkeeper.io/)
[![CircleCI](https://circleci.com/gh/5app/package-template.svg?style=shield)](https://circleci.com/gh/5app/package-template)

This is a template for starting new JS projects at 5app.

## Getting started

Run `npm init` to configure package.json

### For packages to be posted to NPM

1. Remove the setting `private: true` from [./package.json](./package.json]).
   This protects accidentally publishing to *npm*. If you want to publish to npm then this will prevent it until removed.
