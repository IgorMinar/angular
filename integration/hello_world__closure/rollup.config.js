const nodeResolve = require('rollup-plugin-node-resolve');
const inject = require('@rollup/plugin-inject');
const replace = require('@rollup/plugin-replace');
const path = require('path');

export default {
  input: 'dist/_0-ngc-out/src/main.js',
  output: {
    dir: 'dist/_1-rollup-out',
    format: 'es'
  },
  plugins: [
    nodeResolve(),
    inject({
      ngDevMode: [path.resolve('./angular-build-constants.js'), 'ngDevMode'],
      ngJitMode: [path.resolve('./angular-build-constants.js'), 'ngJitMode'],
      ngI18nClosureMode: [path.resolve('./angular-build-constants.js'), 'ngI18nClosureMode']
    }),
    // workaround JSC_BLOCK_SCOPED_DECL_MULTIPLY_DECLARED_ERROR closure buggy isolation of variables
    // declared in ES Modules https://github.com/ampproject/rollup-plugin-closure-compiler/issues/92
    replace({
      Console: 'Console_',
      Location: 'Location_',
    }),
  ]
};
