// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

exports.config = {
  allScriptsTimeout: 25000,
  defaultTimeout: 25000,
  specs: ['./src/features/**/*.feature'],
  capabilities: {
    browserName: 'firefox'
  },
  directConnect: true,
  baseUrl: 'http://localhost:4200/',
  framework: 'custom',
  frameworkPath: require.resolve('protractor-cucumber-framework'),
  cucumberOpts: {
    require: ['./src/features/step_definitions/**/*.steps.ts'],

  },
  plugins: [{
    package: 'wdio-webcomponents'
  }],
  onPrepare() {
    require('ts-node').register({
      project: require('path').join(__dirname, './tsconfig.e2e.json')
    });
  }
};
