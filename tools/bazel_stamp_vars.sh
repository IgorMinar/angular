#!/bin/sh
# Generates the data used by the stamping feature in bazel.
# A genrule with stamp=1 can read the resulting file from bazel-out/volatile-status.txt
echo BUILD_SCM_HASH $(git rev-parse HEAD)

# Find out if there are any uncommitted local changes
echo BUILD_SCM_LOCAL_CHANES $( [[ $(git status --porcelain) ]] && "true" || "false" )