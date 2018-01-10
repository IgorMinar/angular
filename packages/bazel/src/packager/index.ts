import * as shx from 'shelljs';
import * as path from 'path';

function main(args: string[]): number {
  const [out, srcdir, packageJson] = args;
  shx.mkdir("-p", out);
  shx.cp(packageJson, path.join(out, path.basename(packageJson)));
  const typings = shx.find("-R", srcdir).filter(f => f.endsWith(".d.ts") && !f.endsWith(".ngfactory.d.ts") && !f.endsWith(".ngsummary.d.ts"));

  typings.forEach(f => {
    const outputPath = path.join(out, path.relative(srcdir, f));
    shx.mkdir("-p", path.dirname(outputPath));
    shx.cp(f, outputPath);
  });
  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
