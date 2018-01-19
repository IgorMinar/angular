/**
 * @fileoverview Read a tsconfig.json file intended to produce production mode
 * JS output, modify it to produce es5_esm output instead, and write the result
 * to disk.
 */
const fs = require('fs');

function main(args) {
  if (args.length < 2) {
    console.error('Usage: $0 original_tsconfig.json new-root output.json')
  }

  const data = JSON.parse(fs.readFileSync(args[0], {encoding: 'utf-8'}));
  data['compilerOptions']['target'] = 'es5';
  data['bazelOptions']['es5Mode'] = true;
  data['compilerOptions']['outDir'] = require('path').join(data['compilerOptions']['outDir'], args[1]);
  data['angularCompilerOptions']['expectedOut'] = data['angularCompilerOptions']['expectedOut'].map(f =>
    f.replace(/\.closure\.js$/, ".js").replace(/(bazel-out\/k8-fastbuild\/bin)/, `$1/${args[1]}`));
  require('fs').writeFileSync(args[2], JSON.stringify(data), {encoding: 'utf-8'});
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
