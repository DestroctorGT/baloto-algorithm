/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-var-requires */
const { join } = require('path')
/**
* @type {import("puppeteer").Configuration}
*/
module.exports = { cacheDirectory: join(__dirname, '.cache', 'puppeteer') }
