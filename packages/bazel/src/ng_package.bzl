# Copyright Google Inc. All Rights Reserved.
#
# Use of this source code is governed by an MIT-style license that can be
# found in the LICENSE file at https://angular.io/license
"""Implementation of the ng_package rule.
"""
load("@build_bazel_rules_nodejs//:internal/collect_es6_sources.bzl", "collect_es6_sources")

# Produce the package.json file
def _stamp_package_json(ctx):
  package_json = ctx.file.package_json
  version_string = ctx.attr.version
  output = ctx.actions.declare_file("package.json")
  ctx.actions.expand_template(
    template=package_json,
    output=output,
    substitutions={
      "0.0.0-PLACEHOLDER": version_string
    }
  )
  return output


# ng_package produces package that is npm ready.
def _ng_package_impl(ctx):
  npm_package_name = ctx.label.package.split("/")[-1];
  npm_package_directory = ctx.actions.declare_directory(ctx.label.name)
  fesm_2015 = ctx.actions.declare_directory("fesm2015")
  esm_2015_files = collect_es6_sources(ctx).to_list()
  stamped_package_json = _stamp_package_json(ctx)
  license_banner_file = ctx.file.license_banner
  externals = ctx.attr.globals.keys()

  license_banner_path = license_banner_file.path if  (license_banner_file != None) else "/dev/null"

  ctx.actions.run_shell(
      progress_message = "Angular Packaging: rolling up %s" % ctx.label.name,
      mnemonic = "AngularPackageRollup",
      outputs = [fesm_2015],
      inputs = esm_2015_files + [ctx.executable._rollup, license_banner_file],
      command = " ".join([
        # TODO(i): this feels dirty... is there a better way?
        ctx.executable._rollup.path,
        # TODO(i): we probably want to make "index.js" configurable or even better auto-configured
        #   based on the original tsconfig, since we allow the filename to be adjusted via
        #   flatModuleOutFile config property https://angular.io/guide/aot-compiler#flatmoduleoutfile
        # TODO(i): is it ok to rely on the fact that 0-th file in the esm_2015_files is at the root
        #   of the directory? Is there a better way to get this directory path?
        "--input " + esm_2015_files[0].dirname + "/" + npm_package_name + "/index.js",
        "--output " + fesm_2015.path + "/" + npm_package_name + '.js',
        "--banner " + "\"$(cat " + license_banner_path + ")\"",
        "--format es",
        # TODO(i): consider "--sourcemap", "inline"
        # Note: if the input has external source maps then we need to also install and use
        #   `rollup-plugin-sourcemaps`, which will require us to use rollup.config.js file instead
        #   of command line args
        "--sourcemap",
        "--external " + ",".join(externals)
      ]),
    )

  ctx.actions.run(
    progress_message = "Angular Packaging: building npm package for %s" % ctx.label.name,
    mnemonic = "AngularPackage",
    outputs = [npm_package_directory],
    inputs = [fesm_2015, stamped_package_json] + ctx.files.deps + collect_es6_sources(ctx).to_list(),
    executable = ctx.executable._packager,
    arguments = [
      npm_package_directory.path,
      ctx.bin_dir.path + "/" + ctx.attr.package_json.label.package,
      stamped_package_json.path,
      "/".join([ctx.bin_dir.path, ctx.label.package, ctx.label.name + ".es6", ctx.attr.package_json.label.package]),
      fesm_2015.path
    ],
  )

  return struct(
    files = depset([npm_package_directory])
  )

# The directory structure is first determined by the module id. For example,
# it is the target directory for "my_library" or "@angular/core" but it is in a
# subdirectory "part" for "my_library/part" or "http" for the id
# "@angular/common/http"). The <base-name> below refers to the final segment
# of the module id. For example, "my_library" for "my_library", and "core"
# for "@angular/core" and "http" for "@angular/common/http".

# The directory layout is:
#   <directory>/
#     package.json
#     <base-name>.d.ts
#     <base-name>.metadata.json
#     <.d.ts files (potentially in subdirectories)>
#     <index metdata json>
#     esm2015/
#        <baze-name>.js                   (generated index with reexports)
#        public_api.js
#        src/
#           ...


#     bundles/
#       <base-name>.umd.js          (flat umd module, es5 target)
#       <base-name>.umd.js.map
#       <base-name>.umd.min.js
#       <base-name>.umd.min.js.map
#     <module-name>/
#       <base-name>.es5.js          (flat esm module, es5 target)
#       <base-name>.es5.js.map
#       <base-name>.js              (flat esm module, es6 target)
#       <base-name>.js.map

# For a ng_library the directory layout is:
#   <directory>/
#    package.json
#    <.d.ts files (potentially in subdirectories)
#    <.js and .js.map and .metadata.json files (potentially in subdirectories)

ng_package = rule(
    implementation = _ng_package_impl,
    attrs = {
      "deps": attr.label_list(),
      "package_json": attr.label(allow_single_file = FileType([".json"])),
      "license_banner": attr.label(allow_single_file = FileType([".txt"])),
      "version": attr.string(mandatory=True),
      "globals": attr.string_dict(default={}),
      "_packager": attr.label(default=Label("//src/packager"), executable=True, cfg="host"),
      "_rollup": attr.label(default=Label("//src/rollup"), executable=True, cfg="host"),
    }
)
