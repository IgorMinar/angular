# Copyright Google Inc. All Rights Reserved.
#
# Use of this source code is governed by an MIT-style license that can be
# found in the LICENSE file at https://angular.io/license
"""Implementation of the ng_package rule.
"""

# Produce the package.json file
def _package_json(ctx):
  package_json = ctx.file.package_json
  output = ctx.actions.declare_file(ctx.label.name + "_package.json")
  ctx.actions.expand_template(
    template=package_json,
    output=output,
    substitutions={
      "0.0.0-PLACEHOLDER": "0.0.0" # TODO(i): replace with real version stamping
    }
  )
  return output


# ng_package produces package that is npm ready.
def _ng_package_impl(ctx):
  directory = ctx.actions.declare_directory(ctx.label.name)
  ctx.actions.run(
    progress_message = "Angular Packaging: building npm package for %s" % ctx.label.name,
    mnemonic = "AngularPackage",
    outputs = [directory],
    inputs = [ctx.file.package_json] + ctx.files.deps,
    executable = ctx.executable._packager,
    arguments = [
      directory.path,
      ctx.bin_dir.path + "/" + ctx.attr.package_json.label.package,
      ctx.file.package_json.path
    ],
  )

  return struct(
    files = depset([directory])
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
    #  "metadata": attr.bool(default=True),
      "version": attr.string(),
      "_packager": attr.label(default=Label("//src/packager"), executable=True, cfg="host"),
    #  "_rollup": attr.label(default=Label("//internal:rollup"), executable=True, cfg="host"),
    }
)
