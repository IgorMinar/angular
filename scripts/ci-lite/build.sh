#!/usr/bin/env bash

set -ex -o pipefail

echo 'travis_fold:start:BUILD'

# Setup environment
cd `dirname $0`
source ./env.sh
cd ../..

$(npm bin)/tsc -v
$(npm bin)/tsc -p tools
cp tools/@angular/tsc-wrapped/package.json dist/tools/@angular/tsc-wrapped
node dist/tools/@angular/tsc-wrapped/src/main -p modules
for PACKAGE in \
  core \
  compiler \
  common \
  forms \
  platform-browser \
  platform-browser-dynamic \
  platform-server \
  http \
  router \
  upgrade \
  compiler-cli
do
  node dist/tools/@angular/tsc-wrapped/src/main -p modules/@angular/$PACKAGE
  cp  modules/@angular/$PACKAGE/package.json dist/packages-dist/$PACKAGE
done
$(npm bin)/tsc -p modules/benchpress

echo 'travis_fold:end:BUILD'
