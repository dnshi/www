#!/bin/bash
set -e # exit with nonzero exit code if anything fails

echo "Starting deployment"
echo "Target: gh-pages branch"

cd dist
git init

git config --global user.name "Travis CI"
git config --global user.email "dean.xiaoshi@gmail.com"

git add .
git commit -m "Deployed to Github Pages $(date +'%Y-%m-%d %T')"
git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" master:gh-pages > /dev/null 2>&1

echo "Deployed successfully."
