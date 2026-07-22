const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createElement(id) {
  return {
    id,
    value: '',
    checked: false,
    disabled: false,
    textContent: '',
    title: '',
    dataset: {},
    style: {},
    options: [],
    listeners: {},
    classList: {
      toggle() {}
    },
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    appendChild(child) {
      this.options.push(child);
      return child;
    },
    dispatch(type) {
      this.listeners[type]?.({ target: this });
    },
    setAttribute(name, value) {
      this[name] = value;
    }
  };
}

const elements = {};
[
  'enableExtension',
  'showYearsForLongPeriods',
  'showAllDayEvents',
  'showTimedEvents',
  'showTasks',
  'showBirthdays',
  'showDeclinedEvents',
  'showPastEvents',
  'typeFiltersSettingItem',
  'declinedEventsSettingItem',
  'pastEventsSettingItem',
  'yearsSettingItem',
  'unitLabelsSettingItem',
  'yearUnitLabel',
  'dayUnitLabel',
  'hourUnitLabel',
  'displayLanguage',
  'yearsExampleOn',
  'yearsExampleOff',
  'yearsExampleOnPrefix',
  'yearsExampleOffPrefix',
  'status'
].forEach(id => {
  elements[id] = createElement(id);
});

const subtitle = createElement('subtitle');
subtitle.dataset.i18n = 'subtitle';
const typeFiltersLabel = createElement('typeFiltersLabel');
typeFiltersLabel.dataset.i18n = 'typeFiltersLabel';
const showDeclinedEventsLabel = createElement('showDeclinedEventsLabel');
showDeclinedEventsLabel.dataset.i18n = 'showDeclinedEventsLabel';
const saved = { displayLanguage: 'auto' };
let domContentLoaded;

const sandbox = {
  console,
  setTimeout: callback => callback(),
  navigator: { language: 'zh-TW', languages: ['zh-TW'] },
  document: {
    title: '',
    documentElement: { lang: '', dir: '' },
    addEventListener: (_type, listener) => {
      domContentLoaded = listener;
    },
    createElement: tag => createElement(tag),
    getElementById: id => elements[id],
    querySelectorAll: selector => selector === '[data-i18n]' ? [subtitle, typeFiltersLabel, showDeclinedEventsLabel] : []
  },
  chrome: {
    runtime: {},
    storage: {
      sync: {
        get: (_keys, callback) => callback(saved),
        set: (items, callback) => {
          Object.assign(saved, items);
          callback();
        }
      }
    },
    tabs: {
      query: (_query, callback) => callback([]),
      sendMessage: (_tabId, _message, callback) => callback?.()
    }
  }
};

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'Extensions', 'popup.js'), 'utf8'), sandbox);
domContentLoaded();

assert.strictEqual(sandbox.document.documentElement.lang, 'zh-TW');
assert.strictEqual(subtitle.textContent, 'Google 日曆事件倒數設定');
assert.strictEqual(typeFiltersLabel.textContent, '依事件類型顯示');
assert.strictEqual(showDeclinedEventsLabel.textContent, '顯示不參加事件標籤');
assert.strictEqual(elements.yearUnitLabel.value, 'y');
assert.strictEqual(elements.dayUnitLabel.value, 'd');
assert.strictEqual(elements.hourUnitLabel.value, 'h');
[
  'showAllDayEvents',
  'showTimedEvents',
  'showTasks',
  'showBirthdays',
  'showDeclinedEvents',
  'showPastEvents'
].forEach(id => assert.strictEqual(elements[id].checked, true, `${id} defaults to enabled`));

elements.showTasks.checked = false;
elements.showTasks.dispatch('change');
assert.strictEqual(saved.showTasks, false);

elements.showDeclinedEvents.checked = false;
elements.showDeclinedEvents.dispatch('change');
assert.strictEqual(saved.showDeclinedEvents, false);

elements.enableExtension.checked = false;
elements.enableExtension.dispatch('change');
[
  'showAllDayEvents',
  'showTimedEvents',
  'showTasks',
  'showBirthdays',
  'showDeclinedEvents',
  'showPastEvents'
].forEach(id => assert.strictEqual(elements[id].disabled, true, `${id} follows the master switch`));

elements.displayLanguage.value = 'ja';
elements.displayLanguage.dispatch('change');
assert.strictEqual(saved.displayLanguage, 'ja');
assert.strictEqual(sandbox.document.documentElement.lang, 'ja');
assert.strictEqual(subtitle.textContent, 'Google カレンダーのイベントカウントダウン設定');
assert.strictEqual(typeFiltersLabel.textContent, '予定の種類別に表示');
assert.strictEqual(showDeclinedEventsLabel.textContent, '不参加の予定ラベルを表示');

elements.yearUnitLabel.value = '';
elements.dayUnitLabel.value = '';
elements.hourUnitLabel.value = '';
elements.yearUnitLabel.dispatch('change');
assert.strictEqual(elements.yearUnitLabel.value, 'y');
assert.strictEqual(elements.dayUnitLabel.value, 'd');
assert.strictEqual(elements.hourUnitLabel.value, 'h');
assert.strictEqual(saved.yearUnitLabel, 'y');
assert.strictEqual(saved.dayUnitLabel, 'd');
assert.strictEqual(saved.hourUnitLabel, 'h');

console.log('popup i18n checks passed');
