# Event Display Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add type, declined-event, and past-event controls for countdown labels, including reliable Google Tasks support.

**Architecture:** Keep the existing content-script and popup architecture. Store one boolean per control in `chrome.storage.sync`, classify each event once before formatting its prefix, and remove the prefix when any enabled filter rejects it. Detect declined events only through Google Calendar's strikethrough class `.w9eXqe`.

**Tech Stack:** Chrome Extension Manifest V3, plain JavaScript, HTML/CSS, Node.js `assert` tests.

## Global Constraints

- Keep all new settings enabled by default so upgrades preserve current behavior.
- Event types are mutually exclusive in this order: birthday, task, all-day, timed.
- The declined-event filter applies only when the event itself or a descendant has `.w9eXqe`.
- Do not parse localized participation-status text.
- A label is visible only when its type, declined-event, and past-event settings all allow it.
- `showPastEvents` affects dates before today; today's existing behavior remains unchanged.
- Add no permissions, dependencies, abstractions, or version bump.
- Do not commit until the user explicitly reports that manual verification is OK.

---

### Task 1: Content-script classification and filtering

**Files:**
- Modify: `Tests/content.test.js`
- Modify: `Extensions/content.js`

**Interfaces:**
- Produces: `getEventType(eventElement, isAllDay) -> "birthday" | "task" | "allDay" | "timed"`
- Produces: `isDeclinedEvent(eventElement) -> boolean`
- Produces: `shouldShowDatePrefix(eventType, isDeclined, dayDifference) -> boolean`

- [ ] **Step 1: Write failing content tests**

Add assertions covering:

```js
assert.strictEqual(en.getEventType(eventWithId('bday_x'), true), 'birthday');
assert.strictEqual(en.getEventType(eventWithId('tasks_x'), true), 'task');
assert.strictEqual(en.getEventType(eventWithId('event_x'), true), 'allDay');
assert.strictEqual(en.getEventType(eventWithId('event_x'), false), 'timed');

assert.strictEqual(en.isDeclinedEvent(eventWithClasses()), false);
assert.strictEqual(en.isDeclinedEvent(eventWithClasses({ classes: ['w9eXqe'] })), true);
assert.strictEqual(en.isDeclinedEvent(eventWithClasses({ childClasses: ['w9eXqe'] })), true);
assert.strictEqual(en.isDeclinedEvent(eventWithClasses({ childClasses: ['LKeQwe', 'UflSff'] })), false);
```

Toggle each global setting through `vm.runInContext`, assert `shouldShowDatePrefix` rejects only its matching type or declined state, and assert a negative `dayDifference` is rejected only when `showPastEvents` is false. Record the selector passed to `document.querySelectorAll` and assert it is `[data-eventchip][data-eventid], .uFexlc > [data-eventid]`.

Add English and Spanish localized-date regressions where a location contains `1914` before the real date in 2026; assert the parser chooses the year nearest the localized month name.

- [ ] **Step 2: Run the content test and verify RED**

Run: `node Tests/content.test.js`

Expected: FAIL because `getEventType`, `isDeclinedEvent`, or `shouldShowDatePrefix` does not exist.

- [ ] **Step 3: Implement the minimal content logic**

Extend the default/load settings with these booleans:

```js
showAllDayEvents: true,
showTimedEvents: true,
showTasks: true,
showBirthdays: true,
showDeclinedEvents: true,
showPastEvents: true
```

Add the three pure helpers described above. In `addDatePrefixToEvents`, scan event chips plus direct schedule-view event children, compute the mutually exclusive event type and declined state, and pass an empty prefix to `setDatePrefix` when `shouldShowDatePrefix` returns false.

- [ ] **Step 4: Run the content test and verify GREEN**

Run: `node Tests/content.test.js`

Expected: exit 0 with `content parser checks passed`.

### Task 2: Popup controls and synchronized settings

**Files:**
- Modify: `Tests/popup.test.js`
- Modify: `Extensions/popup.js`
- Modify: `Extensions/popup.html`

**Interfaces:**
- Consumes: the six storage keys created in Task 1.
- Produces: four type checkboxes, one declined-event switch, and one independent past-event switch.

- [ ] **Step 1: Write failing popup tests**

Add all six control IDs to the test DOM, then assert:

```js
assert.strictEqual(elements.showAllDayEvents.checked, true);
assert.strictEqual(elements.showTimedEvents.checked, true);
assert.strictEqual(elements.showTasks.checked, true);
assert.strictEqual(elements.showBirthdays.checked, true);
assert.strictEqual(elements.showDeclinedEvents.checked, true);
assert.strictEqual(elements.showPastEvents.checked, true);

elements.showTasks.checked = false;
elements.showTasks.dispatch('change');
assert.strictEqual(saved.showTasks, false);
```

Turn the master switch off and assert all six new controls become disabled. Add translated `typeFiltersLabel` and `showDeclinedEventsLabel` test elements and assert Traditional Chinese and Japanese language changes update them.

- [ ] **Step 2: Run the popup test and verify RED**

Run: `node Tests/popup.test.js`

Expected: FAIL because the new controls are not loaded and do not have change listeners.

- [ ] **Step 3: Implement popup storage and behavior**

Create one `visibilityControls` array whose element IDs equal their storage keys. Add those IDs to the existing `chrome.storage.sync.get` call, default each checkbox with `items[id] !== false`, save `{ [id]: checkbox.checked }` on change, notify the content script, and disable them with the master switch.

- [ ] **Step 4: Add the popup markup and styling**

Under the master enable switch, add:

```html
<div class="setting-item stacked filter-section" id="typeFiltersSettingItem">
  <div>
    <span class="setting-label" data-i18n="typeFiltersLabel">Show by event type</span>
    <p class="setting-description" data-i18n="typeFiltersDescription">Choose which event types receive countdown labels.</p>
  </div>
  <div class="checkbox-grid">
    <label class="checkbox-option"><input type="checkbox" id="showAllDayEvents"><span data-i18n="allDayLabel">All-day</span></label>
    <label class="checkbox-option"><input type="checkbox" id="showTimedEvents"><span data-i18n="timedLabel">Timed</span></label>
    <label class="checkbox-option"><input type="checkbox" id="showTasks"><span data-i18n="tasksLabel">Tasks</span></label>
    <label class="checkbox-option"><input type="checkbox" id="showBirthdays"><span data-i18n="birthdaysLabel">Birthdays</span></label>
  </div>
</div>
<div class="setting-item" id="declinedEventsSettingItem">
  <div>
    <span class="setting-label" data-i18n="showDeclinedEventsLabel">Show declined event labels</span>
    <p class="setting-description" data-i18n="showDeclinedEventsDescription">Show countdown labels on events displayed with a strikethrough.</p>
  </div>
  <label class="switch" data-i18n-title="showDeclinedEventsLabel">
    <input type="checkbox" id="showDeclinedEvents" data-i18n-aria-label="showDeclinedEventsLabel">
    <span class="slider"></span>
  </label>
</div>
<div class="setting-item" id="pastEventsSettingItem">
  <div>
    <span class="setting-label" data-i18n="showPastEventsLabel">Show past event labels</span>
    <p class="setting-description" data-i18n="showPastEventsDescription">Show negative labels, such as -14d, for events before today.</p>
  </div>
  <label class="switch" data-i18n-title="showPastEventsLabel">
    <input type="checkbox" id="showPastEvents" data-i18n-aria-label="showPastEventsLabel">
    <span class="slider"></span>
  </label>
</div>
```

Style `.checkbox-grid` as a two-column grid and `.checkbox-option` as a native checkbox label using the existing focus color `#1a73e8`; do not add a component library.

Add exact localized labels/descriptions for all 13 existing popup languages. English copy:

- `typeFiltersLabel`: `Show by event type`
- `typeFiltersDescription`: `Choose which event types receive countdown labels.`
- `allDayLabel`: `All-day`
- `timedLabel`: `Timed`
- `tasksLabel`: `Tasks`
- `birthdaysLabel`: `Birthdays`
- `showDeclinedEventsLabel`: `Show declined event labels`
- `showDeclinedEventsDescription`: `Show countdown labels on events displayed with a strikethrough.`
- `showPastEventsLabel`: `Show past event labels`
- `showPastEventsDescription`: `Show negative labels, such as -14d, for events before today.`

- [ ] **Step 5: Run the popup test and verify GREEN**

Run: `node Tests/popup.test.js`

Expected: exit 0 with `popup i18n checks passed`.

### Task 3: User documentation and verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: completed user-visible behavior from Tasks 1 and 2.
- Produces: concise feature documentation and final verification evidence.

- [ ] **Step 1: Update README feature bullets**

Describe type filters, the declined-event switch, past-event labels, and Google Tasks support without changing the release version.

- [ ] **Step 2: Run all automated checks**

Run:

```powershell
node Tests/content.test.js
node Tests/popup.test.js
```

Expected: both commands exit 0 and print their success messages.

- [ ] **Step 3: Inspect the final diff and Git state**

Run:

```powershell
git diff --check
git diff -- Extensions/content.js Extensions/popup.js Extensions/popup.html Tests/content.test.js Tests/popup.test.js README.md
git status --short --branch
```

Expected: no whitespace errors, only task-related changes, branch `codex/event-display-filters`, and no staged or committed changes.

- [ ] **Step 4: Stop for manual verification**

Give the user Chrome reload steps and a behavior matrix covering all four types, declined events, past events, and master-disable behavior. Do not commit until the user explicitly says manual verification is OK.
