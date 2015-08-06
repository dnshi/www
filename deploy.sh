#!/bin/bash
set -e # exit with nonzero exit code if anything fails

echo "Starting deployment"
echo "Target: gh-pages branch"

ORIGIN_URL=`git config --get remote.origin.url`
ORIGIN_URL_WITH_CREDENTIALS=${ORIGIN_URL/\/\/github.com/\/\/$GITHUB_TOKEN@github.com}

cd dist
git init

git config --global user.name "Travis CI"
git config --global user.email "dean.xiaoshi@gmail.com"

git add .
git commit -m "Deployed to Github Pages $(date +'%Y-%m-%d %T')"
git push --force --quiet "$ORIGIN_URL_WITH_CREDENTIALS" gh-pages > /dev/null 2>&1

echo "Deployed successfully."
