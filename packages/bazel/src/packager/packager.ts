import * as shx from 'shelljs';
import * as path from 'path';

function filter(ext: string): (path: string) => boolean {
  return f => f.endsWith(ext) && !f.endsWith(`.ngfactory${ext}`) && !f.endsWith(`.ngsummary${ext}`);
}

function main(args: string[]): number {
  shx.set("-e");
  const [out, srcdir, packageJson, readmeMd, /*esm2015src,*/ fesm2015] = args;
  shx.mkdir("-p", out);
  shx.cp(packageJson, path.join(out, 'package.json'));
  shx.cp(readmeMd, path.join(out, 'README.md'));

  const typings = shx.find("-R", srcdir);
  typings.filter(filter(".d.ts"))
  .forEach(f => {
    const outputPath = path.join(out, path.relative(srcdir, f));
    shx.mkdir("-p", path.dirname(outputPath));
    shx.cp(f, outputPath);
  });

  // TODO(i): we currently don't publish individual files, so let's disable this feature for in
  //   order to create a distribution that matches what build.sh builds today
  //
  // const esm2015 = shx.find("-R", esm2015src);
  // esm2015.filter(filter(".js")).forEach(f => {
  //   const outputPath = path.join(out, "esm2015", path.relative(esm2015src, f));
  //   shx.mkdir("-p", path.dirname(outputPath));
  //   shx.cp(f, outputPath);
  // });
  //
  // shx.cp("-R", fesm2015, out);

  const esm2015Dir = path.join(out, 'esm2015');
  shx.mkdir("-p", esm2015Dir);
  shx.cp("-R", fesm2015 + "/*", esm2015Dir);

  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
