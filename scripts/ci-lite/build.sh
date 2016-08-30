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
./build.sh
$(npm bin)/tsc -p modules/benchpress

echo 'travis_fold:end:BUILD'
