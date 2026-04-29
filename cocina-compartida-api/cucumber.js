module.exports = {
    default: `
        --require-module ts-node/register
        --require test/features/support/setup.ts
        --require test/features/step_definitions/**/*.ts
        --format @serenity-js/cucumber
        test/features/**/*.feature
    `
};
