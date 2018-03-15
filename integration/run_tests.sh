#!/usr/bin/env bash

set -e -o pipefail

currentDir=$(cd $(dirname $0); pwd)
cd ${currentDir}


echo "#################################"
echo "Building @angular/* npm packages "
echo "#################################"

# Ideally these integration tests should run under bazel, and just list the npm
# packages in their deps[].
# Until then, we have to manually run bazel first to create the npm packages we
# want to test.
bazel query --output=label 'kind(npm_package, //packages/...) union kind(ng_package, //packages/...)' \
  | xargs bazel build

# Allow this test to run even if dist/ doesn't exist yet.
# Under Bazel we don't need to create the dist folder to run the integration tests
if [[ ! -d '../dist' ]]; then mkdir ../dist; fi

# Similar to --symlink_prefix=dist/ but without creating the bazel-out symlink
# since that has caused problems with VSCode traversing into there and exhausting
# system filehandles.
if [[ ! -h '../dist/bin' ]]; then ln -s $(bazel info bazel-bin) ../dist/bin; fi

readonly thisDir=$(cd $(dirname $0); pwd)

# Track payload size functions
# TODO(alexeagle): finish migrating these to buildsize.org
if [[ -v TRAVIS ]]; then
  # We don't install this by default because it contains some broken Bazel setup
  # and also it's a very big dependency that we never use except on Travis.
  yarn add -D firebase-tools@3.12.0
  source ../scripts/ci/payload-size.sh
fi

# Workaround https://github.com/yarnpkg/yarn/issues/2165
# Yarn will cache file://dist URIs and not update Angular code
readonly cache=.yarn_local_cache
function rm_cache {
  rm -rf $cache
}
rm_cache
mkdir $cache
trap rm_cache EXIT

for testDir in $(ls | grep -Ev 'node_modules|render3') ; do
  [[ -d "$testDir" ]] || continue
  echo "#################################"
  echo "Running integration test $testDir"
  echo "#################################"
  (
    cd $testDir
    rm -rf dist
    yarn install --cache-folder ../$cache
    yarn test || exit 1
    # Track payload size for cli-hello-world and hello_world__closure and the render3 tests
    if [[ $testDir == cli-hello-world ]] || [[ $testDir == hello_world__closure ]] || [[ $testDir == hello_world__render3__closure ]] || [[ $testDir == hello_world__render3__rollup ]] || [[ $testDir == hello_world__render3__cli ]]; then
      if [[ $testDir == cli-hello-world ]] || [[ $testDir == hello_world__render3__cli ]]; then
        yarn build
      fi
      if [[ -v TRAVIS ]]; then
        trackPayloadSize "$testDir" "dist/*.js" true false "${thisDir}/_payload-limits.json"
      fi
    fi
    if [[ -v TRAVIS ]]; then
      # remove the temporary node modules directory to save space.
      rm -rf node_modules
    fi
  )
done

if [[ -v TRAVIS ]]; then
  trackPayloadSize "umd" "../dist/packages-dist/*/bundles/*.umd.min.js" false false
fi
