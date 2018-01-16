#!/bin/sh
set -u -e -o pipefail

# Generates the data used by the stamping feature in bazel.
# A genrule with stamp=1 can read the resulting file from bazel-out/volatile-status.txt
echo BUILD_SCM_HASH $(git rev-parse HEAD)

BUILD_SCM_VERSION_RAW=$(git describe --abbrev=7 --tags HEAD)

# Find out if there are any uncommitted local changes
# TODO(i): is it ok to use "--untracked-files=no" to ignore untracked files since they should not affect anything
[[ $(git status --untracked-files=no --porcelain) ]] && LOCAL_CHANGES="true" || LOCAL_CHANGES="false"
echo BUILD_SCM_LOCAL_CHANGES ${LOCAL_CHANGES}

# Reformat `git describe` version string into a more semver-ish string
#   From:   5.2.0-rc.0-57-g757f886
#   To:     5.2.0-rc.0+57.sha-757f886
#   Or:     5.2.0-rc.0+57.sha-757f886.with-local-changes
BUILD_SCM_VERSION="$(echo ${BUILD_SCM_VERSION_RAW} | sed -E 's/-([0-9]+)-g/+\1.sha-/g')""$( [[ $LOCAL_CHANGES == "true" ]] && echo ".with-local-changes")"
echo BUILD_SCM_VERSION ${BUILD_SCM_VERSION}
