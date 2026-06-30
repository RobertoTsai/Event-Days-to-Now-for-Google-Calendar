// popup.js
document.addEventListener('DOMContentLoaded', function() {
  var enableExtension = document.getElementById('enableExtension');
  var showYearsForLongPeriods = document.getElementById('showYearsForLongPeriods');
  var yearsSettingItem = document.getElementById('yearsSettingItem');
  var yearsExampleOn = document.getElementById('yearsExampleOn');
  var yearsExampleOff = document.getElementById('yearsExampleOff');
  var status = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['enableExtension', 'showYearsForLongPeriods'], function(items) {
    if (chrome.runtime.lastError) return;
    items = items || {};
    enableExtension.checked = items.enableExtension !== false; // Default to true
    showYearsForLongPeriods.checked = items.showYearsForLongPeriods !== false; // Default to true
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

  function updateYearsSettingVisibility() {
    var enabled = enableExtension.checked;
    yearsSettingItem.classList.toggle('disabled', !enabled);
    yearsSettingItem.setAttribute('aria-disabled', String(!enabled));
    showYearsForLongPeriods.disabled = !enabled;
    updateYearsExampleState();
  }

  function updateYearsExampleState() {
    var showYears = showYearsForLongPeriods.checked;
    yearsExampleOn.classList.toggle('active', showYears);
    yearsExampleOff.classList.toggle('active', !showYears);
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
