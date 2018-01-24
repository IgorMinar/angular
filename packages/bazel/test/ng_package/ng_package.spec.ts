import * as shx from 'shelljs';
import * as path from 'path';

const corePackagePath = path.join(process.env['TEST_SRCDIR'], 'angular', 'packages', 'core', 'npm_package');
shx.cd(corePackagePath);

/**
 * Utility functions that allows me to create regular expressions for string containing paths as
 *   r`/some/long/path` rather than as /\/some\/long\/path/ or RegExp('/some/long/path')
 */
// TODO(i): keep or remove? it's not needed any more...
function r(templateStringArray: TemplateStringsArray) {
  return new RegExp(templateStringArray.join(''));
}

/**
 * Utility functions that allows me to create fs paths
 *   p`${foo}/some/${{bar}}/path` rather than path.join(foo, 'some',
 */
function p(templateStringArray: TemplateStringsArray) {
  const segments = [];
  for (const entry of templateStringArray) {
    segments.push(...entry.split("/").filter(s => s !== ''));
  }
  return path.join(...segments);
}


describe("ng_package", () => {

  describe("misc root files", () => {

    describe("README.md", () => {

      it("should have a README.md file with basic info", () => {
        expect(shx.cat('README.md')).toContain(`Angular`);
        expect(shx.cat('README.md')).toContain(`https://github.com/angular/angular`);
      });
    });
  });


  describe("primary entry-point", () => {

    describe("package.json", () => {

      const packageJson = 'package.json';

      it("should have a package.json file", () => {
        expect(shx.grep('"name":', packageJson)).toContain(`@angular/core`);
      });


      it("should contain correct version number with the PLACEHOLDER string replaced", () => {
        expect(shx.grep('"version":', packageJson)).toMatch(/\d+\.\d+\.\d+(?!-PLACEHOLDER)/);
      });

      it("should contain module resolution mappings", () => {
        const packageJson = 'package.json';
        expect(shx.grep('"main":', packageJson)).toContain(`./bundles/core.umd.js`);
        expect(shx.grep('"module":', packageJson)).toContain(`./esm5/core.js`);
        expect(shx.grep('"es2015":', packageJson)).toContain(`./esm2015/core.js`);
        expect(shx.grep('"typings":', packageJson)).toContain(`./core.d.ts`);
      });
    });


    describe("typescript support", () => {

      it("should have an index.d.ts file", () => {
        expect(shx.cat('index.d.ts')).toContain(`export *`);
      });
    });


    describe("angular metadata", () => {

      it("should have metadata.json files", () => {
        expect(shx.cat('core.metadata.json')).toContain(`"__symbolic":"module"`);
      });
    });


    describe('fesm15', () => {

      it('should have a fesm15 file in the /esm2015 directory', () => {
        expect(shx.cat('esm2015/core.js')).toContain(`export {`);
      });

      it('should have a source map', () => {
        expect(shx.cat('esm2015/core.js.map')).toContain(`{"version":3,"file":"core.js","sources":`);
      });

      it('should have the version info in the header', () => {
        expect(shx.cat('esm2015/core.js')).toMatch(/@license Angular v\d+\.\d+\.\d+(?!-PLACEHOLDER)/);
      });
    });


    xdescribe('fesm5', () => {

      it('should have a fesm5 file in the /esm5 directory', () => {
        expect(shx.cat('esm5/testing.js')).toContain(`export {`);
      });

      it('should have a source map', () => {
        expect(shx.cat('esm5/testing.js.map')).toContain(`{"version":3,"file":"testing.js","sources":`);
      });
    });


    xdescribe('umd', () => {

      it('should have a umd file in the /bundles directory', () => {
        expect(shx.ls('bundles/core.umd.js').length).toBe(1, "File not found");
      });

      it('should have a source map next to the umd file', () => {
        expect(shx.ls('bundles/core.umd.js.map').length).toBe(1, "File not found");
      });

      it('should have a minified umd file in the /bundles directory', () => {
        expect(shx.ls('bundles/core.umd.min.js').length).toBe(1, "File not found");
      });

      it('should have a source map next to the minified umd file', () => {
        expect(shx.ls('bundles/core.umd.min.js.map').length).toBe(1, "File not found");
      });
    });
  });

  xdescribe("secondary entry-point", () => {
    describe("package.json", () => {

      const packageJson = p`testing/package.json`;

      it("should have a package.json file", () => {
        expect(shx.grep('"name":', packageJson)).toContain(`@angular/core/testing`);
      });

      it("should have its module resolution mappings defined in the nested package.json", () => {
        const packageJson = p`testing/package.json`;
        expect(shx.grep('"main":', packageJson)).toContain(`../bundles/core-testing.umd.js`);
        expect(shx.grep('"module":', packageJson)).toContain(`../esm5/testing.js`);
        expect(shx.grep('"es2015":', packageJson)).toContain(`../esm2015/testing.js`);
        expect(shx.grep('"typings":', packageJson)).toContain(`../testing.d.ts`);
      });
    });

    describe("typescript support", () => {

      // TODO(i): why in the parent dir?
      it("should have an 'redirect' d.ts file in the parent dir", () => {
        expect(shx.cat('testing/testing.d.ts')).toContain(`export *`);
      });

      it("should have a 'actual' d.ts file in the parent dir", () => {
        expect(shx.cat('testing/testing.d.ts')).toContain(`export * from './testing/testing'`);
      });
    });

    describe("angular metadata file", () => {
      it("should have a 'redirect' metadata.json file next to the d.ts file", () => {
        expect(shx.cat('testing.metadata.json')).toContain(`"exports":[{"from":"./testing/testing"}],"flatModuleIndexRedirect":true`);
      });

      it("should have an 'actual' metadata.json file", () => {
        expect(shx.cat('core/testing.metadata.json')).toContain(`"metadata":{"async":{"__symbolic":"function"},`);
      });
    })
  });
});
