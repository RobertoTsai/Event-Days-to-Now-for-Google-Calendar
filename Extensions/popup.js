// popup.js
document.addEventListener('DOMContentLoaded', function() {
  var enableExtension = document.getElementById('enableExtension');
  var showYearsForLongPeriods = document.getElementById('showYearsForLongPeriods');
  var yearsSettingItem = document.getElementById('yearsSettingItem');
  var unitLabelsSettingItem = document.getElementById('unitLabelsSettingItem');
  var yearUnitLabel = document.getElementById('yearUnitLabel');
  var dayUnitLabel = document.getElementById('dayUnitLabel');
  var hourUnitLabel = document.getElementById('hourUnitLabel');
  var yearsExampleOn = document.getElementById('yearsExampleOn');
  var yearsExampleOff = document.getElementById('yearsExampleOff');
  var yearsExampleOnPrefix = document.getElementById('yearsExampleOnPrefix');
  var yearsExampleOffPrefix = document.getElementById('yearsExampleOffPrefix');
  var status = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['enableExtension', 'showYearsForLongPeriods', 'yearUnitLabel', 'dayUnitLabel', 'hourUnitLabel'], function(items) {
    if (chrome.runtime.lastError) return;
    items = items || {};
    enableExtension.checked = items.enableExtension !== false; // Default to true
    showYearsForLongPeriods.checked = items.showYearsForLongPeriods !== false; // Default to true
    yearUnitLabel.value = getUnitLabel(items.yearUnitLabel, 'y');
    dayUnitLabel.value = getUnitLabel(items.dayUnitLabel, 'd');
    hourUnitLabel.value = getUnitLabel(items.hourUnitLabel, 'h');
    updateYearsSettingVisibility();
  });

  // Save settings when checkboxes are clicked
  enableExtension.addEventListener('change', function() {
    chrome.storage.sync.set({ enableExtension: enableExtension.checked }, function() {
      if (chrome.runtime.lastError) return;
      updateYearsSettingVisibility();
      updateStatus('Settings saved');
      notifyContentScript();
    });
  });

  showYearsForLongPeriods.addEventListener('change', function() {
    chrome.storage.sync.set({ showYearsForLongPeriods: showYearsForLongPeriods.checked }, function() {
      if (chrome.runtime.lastError) return;
      updateYearsExampleState();
      updateStatus('Settings saved');
      notifyContentScript();
    });
  });

  [yearUnitLabel, dayUnitLabel, hourUnitLabel].forEach(function(input) {
    input.addEventListener('input', updateYearsExampleState);
    input.addEventListener('change', saveUnitLabels);
  });

  function updateYearsSettingVisibility() {
    var enabled = enableExtension.checked;
    yearsSettingItem.classList.toggle('disabled', !enabled);
    unitLabelsSettingItem.classList.toggle('disabled', !enabled);
    yearsSettingItem.setAttribute('aria-disabled', String(!enabled));
    unitLabelsSettingItem.setAttribute('aria-disabled', String(!enabled));
    showYearsForLongPeriods.disabled = !enabled;
    yearUnitLabel.disabled = !enabled;
    dayUnitLabel.disabled = !enabled;
    hourUnitLabel.disabled = !enabled;
    updateYearsExampleState();
  }

  function updateYearsExampleState() {
    var showYears = showYearsForLongPeriods.checked;
    var yearLabel = getUnitLabel(yearUnitLabel.value, 'y');
    var dayLabel = getUnitLabel(dayUnitLabel.value, 'd');
    yearsExampleOnPrefix.textContent = '1' + yearLabel + '5' + dayLabel;
    yearsExampleOffPrefix.textContent = '370' + dayLabel;
    yearsExampleOn.classList.toggle('active', showYears);
    yearsExampleOff.classList.toggle('active', !showYears);
  }

  function saveUnitLabels() {
    fillDefaultUnitLabels();
    updateYearsExampleState();
    chrome.storage.sync.set({
      yearUnitLabel: yearUnitLabel.value,
      dayUnitLabel: dayUnitLabel.value,
      hourUnitLabel: hourUnitLabel.value
    }, function() {
      if (chrome.runtime.lastError) return;
      updateStatus('Settings saved');
      notifyContentScript();
    });
  }

  function fillDefaultUnitLabels() {
    yearUnitLabel.value = getUnitLabel(yearUnitLabel.value, 'y');
    dayUnitLabel.value = getUnitLabel(dayUnitLabel.value, 'd');
    hourUnitLabel.value = getUnitLabel(hourUnitLabel.value, 'h');
  }

  function getUnitLabel(value, fallback) {
    return String(value || '').trim() || fallback;
  }

  function updateStatus(message) {
    status.textContent = message;
    status.style.opacity = 1;
    setTimeout(function() {
      status.style.opacity = 0;
    }, 1500);
  }

  function notifyContentScript() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (chrome.runtime.lastError || !tabs[0]?.id) return;
      chrome.tabs.sendMessage(tabs[0].id, {action: "updateSettings"}, function() {
        if (chrome.runtime.lastError) return;
      });
    });
  }
});
