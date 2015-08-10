These tsconf.json files are here for better debugging and profiling of the typescript compilation process.

To run ES5 build do the following:

```
npm install  # unless you have the latest node deps already
./node_modules/.bin/tsc -p modules
```


To run ES6 build do the following:
```
npm install  # unless you have the latest node deps already 
cp modules/tsconfig.json-es6 modules/tsconfig.json
rm modules/angular2/traceur-runtime.d.ts modules/angular2/typings/es6-promise/es6-promise.d.ts modules/angular2/typings/tsd.d.ts
./node_modules/.bin/tsc -p modules
```


To switch back to ES5:
```
cp modules/tsconfig.json-es5 modules/tsconfig.json
tsd reinstall --overwrite --config modules/angular2/tsd.json
git co modules/angular2/traceur-runtime.d.ts
./node_modules/.bin/tsc -p modules
```

