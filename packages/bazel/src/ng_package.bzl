# Copyright Google Inc. All Rights Reserved.
#
# Use of this source code is governed by an MIT-style license that can be
# found in the LICENSE file at https://angular.io/license
"""Implementation of the ng_package rule.
"""
load("@build_bazel_rules_nodejs//:internal/collect_es6_sources.bzl", "collect_es6_sources")

# Produce the package.json file
def _stamp_file(ctx, input_file, output_file_name):
  version_string = ctx.attr.version
  output = ctx.actions.declare_file(output_file_name)
  ctx.actions.expand_template(
    template=input_file,
    output=output,
    substitutions={
      "0.0.0-PLACEHOLDER": version_string
    }
  )
  return output


def _rollup_esm2015(ctx, fesm_2015, esm_2015_files, license_banner_file, npm_package_name, license_banner_path, externals, entry_point_name):
  if  (npm_package_name == entry_point_name):
    input_dir = npm_package_name
  else:
    input_dir = npm_package_name + "/" + entry_point_name

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
          "--input " + esm_2015_files[0].dirname + "/" + input_dir + "/index.js",
          "--output " + fesm_2015.path + "/" + entry_point_name + '.js',
          "--banner " + "\"$(cat " + license_banner_path + ")\"",
          "--format es",
          # TODO(i): consider "--sourcemap", "inline"
          # Note: if the input has external source maps then we need to also install and use
          #   `rollup-plugin-sourcemaps`, which will require us to use rollup.config.js file instead
          #   of command line args
          "--sourcemap",
          "--external " + ",".join(externals),
        ]),
      )

# ng_package produces package that is npm ready.
def _ng_package_impl(ctx):
  npm_package_name = ctx.label.package.split("/")[-1];
  npm_package_directory = ctx.actions.declare_directory(ctx.label.name)
  fesm_2015 = ctx.actions.declare_directory("fesm2015-" + npm_package_name)
  fesms_2015 = [fesm_2015]
  esm_2015_files = collect_es6_sources(ctx).to_list()
  stamped_package_json = _stamp_file(ctx, ctx.file.package_json, "package.json")
  readme_md = ctx.file.readme_md
  license_banner_file = _stamp_file(ctx, ctx.file.license_banner, "license-banner.txt")
  externals = ctx.attr.globals.keys()

  license_banner_path = license_banner_file.path if  (license_banner_file != None) else "/dev/null"

  _rollup_esm2015(ctx, fesm_2015, esm_2015_files, license_banner_file, npm_package_name, license_banner_path, externals, npm_package_name)

  for entry_point in ctx.attr.secondary_entry_points:
    entry_point_name = entry_point.name
    fesm_2015 = ctx.actions.declare_directory("fesm2015-" + entry_point_name)
    fesms_2015.append(fesm_2015)
    externals = entry_point.globals.keys()
    _rollup_esm2015(ctx, fesm_2015, esm_2015_files, license_banner_file, npm_package_name, license_banner_path, externals, entry_point_name)

  fesm_2015_paths = [f.path for f in fesms_2015]

  ctx.actions.run(
    progress_message = "Angular Packaging: building npm package for %s" % ctx.label.name,
    mnemonic = "AngularPackage",
    outputs = [npm_package_directory],
    inputs = fesms_2015 + [stamped_package_json, readme_md] + ctx.files.deps + collect_es6_sources(ctx).to_list(),
    executable = ctx.executable._packager,
    arguments = [
      npm_package_directory.path,
      ctx.bin_dir.path + "/" + ctx.attr.package_json.label.package,
      stamped_package_json.path,
      readme_md.path,
      # TODO(i): unflattened js files are disabled for now to match the output of build.sh
      #"/".join([ctx.bin_dir.path, ctx.label.package, ctx.label.name + ".es6", ctx.attr.package_json.label.package]),
      ",".join(fesm_2015_paths)
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
#   [x] <primary-entry-point>/
#   [.]   package.json
#   [x]   README.md
#   [x]   <primary-entry-point>.d.ts
#   [x]   <primary-entry-point>.metadata.json
#   [ ]   <secondary-entry-point>.d.ts
#   [ ]   <secondary-entry-point>.metadata.json
#   [ ]   <secondary-entry-point>/
#   [ ]     package.json
#   [x]     <secondary-entry-point>.d.ts
#   [ ]     <secondary-entry-point>.metadata.json
#   [ ]   bundles/
#   [ ]     <primary-entry-point>.umd.js
#   [ ]     <primary-entry-point>.umd.js.map
#   [ ]     <primary-entry-point>.umd.min.js
#   [ ]     <primary-entry-point>.umd.min.js.map
#   [ ]     <secondary-entry-point>.umd.js
#   [ ]     <secondary-entry-point>.umd.js.map
#   [ ]     <secondary-entry-point>.umd.min.js
#   [ ]     <secondary-entry-point>.umd.min.js.map
#   [x]   esm2015/
#   [x]     <primary-entry-point>.js
#   [x]     <primary-entry-point>.js.map
#   [ ]     <secondary-entry-point>.js
#   [ ]     <secondary-entry-point>.js.map
#   [ ]   esm5/
#   [ ]     <primary-entry-point>.js
#   [ ]     <primary-entry-point>.js.map
#   [ ]     <secondary-entry-point>.js
#   [ ]     <secondary-entry-point>.js.map
#   [ ]   <extra-files>
ng_package = rule(
    implementation = _ng_package_impl,
    attrs = {
      "deps": attr.label_list(),
      "package_json": attr.label(allow_single_file = FileType([".json"])),
      "readme_md": attr.label(allow_single_file = FileType([".md"])),
      "license_banner": attr.label(allow_single_file = FileType([".txt"])),
      "version": attr.string(mandatory=True),
      "globals": attr.string_dict(default={}),
      "secondary_entry_points": attr.label_list(),
      "_packager": attr.label(default=Label("//src/packager"), executable=True, cfg="host"),
      "_rollup": attr.label(default=Label("//src/rollup"), executable=True, cfg="host"),
    }
)


def _ng_package_entry_point_impl(ctx):
  return  struct(
      name = ctx.attr.name,
      globals = ctx.attr.globals
  )

ng_package_entry_point = rule(
    implementation = _ng_package_entry_point_impl,
    attrs = {
        "globals": attr.string_dict(default={})
    }
)