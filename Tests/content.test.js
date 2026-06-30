const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadContentScript(locale) {
  const sandbox = {
    console,
    clearTimeout,
    setTimeout,
    Intl,
    Date,
    parseInt,
    isNaN,
    navigator: { language: locale, languages: [locale] },
    chrome: {
      storage: { sync: { get: (_keys, callback) => callback({}) } },
      runtime: { onMessage: { addListener: () => {} } }
    },
    document: {
      readyState: 'loading',
      hidden: false,
      body: {},
      documentElement: { lang: locale },
      addEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => []
    },
    MutationObserver: class {
      observe() {}
      disconnect() {}
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'Extensions', 'content.js'), 'utf8'), sandbox);
  return sandbox;
}

const fr = loadContentScript('fr-FR');
const frenchDate = fr.parseDateFromString('Equipe, mardi 30 juin 2026 a 15:30');
assert.strictEqual(frenchDate.getFullYear(), 2026);
assert.strictEqual(frenchDate.getMonth(), 5);
assert.strictEqual(frenchDate.getDate(), 30);
const frenchTime = fr.parseTimeFromString('Equipe, mardi 30 juin 2026 a 15:30');
assert.strictEqual(frenchTime.hours, 15);
assert.strictEqual(frenchTime.minutes, 30);

const zh = loadContentScript('zh-TW');
const chineseDate = zh.parseDateFromString('活動，2026年6月30日 下午3:30');
assert.strictEqual(chineseDate.getFullYear(), 2026);
assert.strictEqual(chineseDate.getMonth(), 5);
assert.strictEqual(chineseDate.getDate(), 30);
const chineseTime = zh.parseTimeFromString('活動，2026年6月30日 下午3:30');
assert.strictEqual(chineseTime.hours, 15);
assert.strictEqual(chineseTime.minutes, 30);

const en = loadContentScript('en-US');
const englishDate = en.parseDateFromString('May 5 report, Tuesday, June 30, 2026 ⋅ 3:30 PM');
assert.strictEqual(englishDate.getFullYear(), 2026);
assert.strictEqual(englishDate.getMonth(), 5);
assert.strictEqual(englishDate.getDate(), 30);
const englishTime = en.parseTimeFromString('May 5 report, Tuesday, June 30, 2026 ⋅ 3:30 PM');
assert.strictEqual(englishTime.hours, 15);
assert.strictEqual(englishTime.minutes, 30);
assert.strictEqual(en.formatTimeDifference(370, 0, true, false, false), '1y5d');
assert.strictEqual(en.formatTimeDifference(0, 5, false, true, false), '5h');
vm.runInContext("settings.yearUnitLabel = '年'; settings.dayUnitLabel = '天'; settings.hourUnitLabel = '小時';", en);
assert.strictEqual(en.formatTimeDifference(370, 0, true, false, false), '1年5天');
assert.strictEqual(en.formatTimeDifference(0, 5, false, true, false), '5小時');
vm.runInContext('settings.showYearsForLongPeriods = false;', en);
assert.strictEqual(en.formatTimeDifference(370, 0, true, false, false), '370天');

const sinhalaDate = en.parseDateFromString('ගිණුම ගෙවීම, බදාදා, ජූලි 1, 2026');
assert.strictEqual(sinhalaDate.getFullYear(), 2026);
assert.strictEqual(sinhalaDate.getMonth(), 6);
assert.strictEqual(sinhalaDate.getDate(), 1);

const machineDate = fr.parseMachineDate('20260630');
assert.strictEqual(machineDate.getFullYear(), 2026);
assert.strictEqual(machineDate.getMonth(), 5);
assert.strictEqual(machineDate.getDate(), 30);

const badAncestorEvent = {
  matches: () => false,
  querySelector: () => null,
  getAttribute: () => null,
  parentElement: { getAttribute: attribute => attribute === 'data-date' ? '2026-02-01' : null }
};
assert.strictEqual(en.parseDateFromElementMetadata(badAncestorEvent), null);

const classes = new Set();
const outerHost = { id: 'outer' };
const innerTitle = {
  querySelector: () => null,
  closest: selector => selector === '.nHqeVd, .uFexlc' ? outerHost : null
};
assert.strictEqual(en.getPrefixHost(innerTitle), outerHost);
assert.strictEqual(en.getPrefixHost({
  querySelector: selector => selector === '.nHqeVd, .uFexlc' ? outerHost : null,
  closest: () => null
}), outerHost);

const prefixHost = {
  dataset: {},
  querySelector: () => null,
  classList: {
    add: (...names) => names.forEach(name => classes.add(name)),
    remove: (...names) => names.forEach(name => classes.delete(name))
  }
};
en.setDatePrefix(prefixHost, '1d', true);
assert.strictEqual(prefixHost.dataset.datePrefix, '1d');
assert.strictEqual(classes.has('date-prefix-ready'), true);
assert.strictEqual(classes.has('date-prefix-host'), true);
assert.strictEqual(classes.has('date-prefix-all-day'), true);
en.setDatePrefix(prefixHost, '', false);
assert.strictEqual(prefixHost.dataset.datePrefix, undefined);
assert.strictEqual(classes.has('date-prefix-ready'), true);
assert.strictEqual(classes.has('date-prefix-host'), false);
assert.strictEqual(en.canUseExtensionApi(), false);

const invalidContext = loadContentScript('en-US');
invalidContext.chrome = {
  storage: { sync: { get: (_keys, callback) => callback({}) } },
  runtime: {
    id: 'test-extension',
    get lastError() {
      throw new Error('Extension context invalidated.');
    },
    onMessage: { addListener: () => {} }
  }
};
let invalidLoaded = true;
invalidContext.loadSettings((loaded) => {
  invalidLoaded = loaded;
});
assert.strictEqual(invalidLoaded, false);
assert.strictEqual(invalidContext.canUseExtensionApi(), false);

console.log('content parser checks passed');
