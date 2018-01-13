import * as shx from 'shelljs';
import * as path from 'path';

function filter(ext: string): (path: string) => boolean {
  return f => f.endsWith(ext) && !f.endsWith(`.ngfactory${ext}`) && !f.endsWith(`.ngsummary${ext}`);
}

function main(args: string[]): number {
  shx.set("-e");
  const [out, srcdir, packageJson, esm2015src, fesm2015] = args;
  shx.mkdir("-p", out);
  shx.cp(packageJson, path.join(out, path.basename(packageJson)));

  const typings = shx.find("-R", srcdir);
  typings.filter(filter(".d.ts"))
  .forEach(f => {
    const outputPath = path.join(out, path.relative(srcdir, f));
    shx.mkdir("-p", path.dirname(outputPath));
    shx.cp(f, outputPath);
  });

  const esm2015 = shx.find("-R", esm2015src);
  esm2015.filter(filter(".js")).forEach(f => {
    const outputPath = path.join(out, "esm2015", path.relative(esm2015src, f));
    shx.mkdir("-p", path.dirname(outputPath));
    shx.cp(f, outputPath);
  });

  const fesm2015Dir = path.join(out, "fesm2015");
  shx.mkdir("-p", fesm2015Dir);
  shx.cp(fesm2015, fesm2015Dir);

  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
