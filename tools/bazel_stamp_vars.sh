#!/bin/sh
# Generates the data used by the stamping feature in bazel.
# A genrule with stamp=1 can read the resulting file from bazel-out/volatile-status.txt
echo BUILD_SCM_HASH $(git rev-parse HEAD)