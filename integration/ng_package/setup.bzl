# TODO(i): this is super awkward, move to the main repo deps (angular_deps)?
load("@build_bazel_rules_nodejs//:defs.bzl", "npm_install")

def setup():

  npm_install(
      name = "bazel_ng_package_deps",
      package_json = "//integration/ng_package:package.json",
  )