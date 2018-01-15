#!/bin/sh
# Generates the data used by the stamping feature in bazel.
# A genrule with stamp=1 can read the resulting file from bazel-out/volatile-status.txt
echo BUILD_SCM_HASH $(git rev-parse HEAD)

BUILD_SCM_VERSION_RAW=$(git describe --abbrev=7 --tags HEAD)

# Find out if there are any uncommitted local changes
# TODO(i): is it ok to use "--untracked-files=no" to ignore untracked files since they should not affect anything
[[ $(git status --untracked-files=no --porcelain) ]] && LOCAL_CHANGES="true" || LOCAL_CHANGES="false"
echo BUILD_SCM_LOCAL_CHANGES ${LOCAL_CHANGES}

# - strip git's "-g" prefix before SHA
# - add + if there were local changes during the build
BUILD_SCM_VERSION="${BUILD_SCM_VERSION_RAW/\-g/-}$( [[ $LOCAL_CHANGES == "true" ]] && echo "+")"
echo BUILD_SCM_VERSION ${BUILD_SCM_VERSION}
