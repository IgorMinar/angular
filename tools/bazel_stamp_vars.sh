#!/bin/sh
# Generates the data used by the stamping feature in bazel.
# A genrule with stamp=1 can read the resulting file from bazel-out/volatile-status.txt
echo BUILD_SCM_HASH $(git rev-parse HEAD)

BUILD_SCM_BUILD_VERSION_RAW=$(git describe --tags HEAD)
# strip "-g" prefix before SHA
BUILD_SCM_BUILD_VERSION=${BUILD_SCM_BUILD_VERSION_RAW/\-g/\-}
echo BUILD_SCM_BUILD_VERSION ${BUILD_SCM_BUILD_VERSION}

# Find out if there are any uncommitted local changes
# TODO(i): consider "--untracked-files=no" to ignore untracked files since they should not affect anything
[[ $(git status --untracked-files=no --porcelain) ]] && LOCAL_CHANGES="true" || LOCAL_CHANGES="false"
echo BUILD_SCM_LOCAL_CHANGES ${LOCAL_CHANGES}
