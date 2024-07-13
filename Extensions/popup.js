// popup.js
document.addEventListener('DOMContentLoaded', function() {
  var enableExtension = document.getElementById('enableExtension');
  var showYearsForLongPeriods = document.getElementById('showYearsForLongPeriods');
  var yearsSettingItem = document.getElementById('yearsSettingItem');
  var status = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['enableExtension', 'showYearsForLongPeriods'], function(items) {
    enableExtension.checked = items.enableExtension !== false; // Default to true
    showYearsForLongPeriods.checked = items.showYearsForLongPeriods !== false; // Default to true
    updateYearsSettingVisibility();
  });

  // Save settings when checkboxes are clicked
  enableExtension.addEventListener('change', function() {
    chrome.storage.sync.set({ enableExtension: enableExtension.checked }, function() {
      updateYearsSettingVisibility();
      updateStatus('Settings saved');
      notifyContentScript();
    });
  });

  showYearsForLongPeriods.addEventListener('change', function() {
    chrome.storage.sync.set({ showYearsForLongPeriods: showYearsForLongPeriods.checked }, function() {
      updateStatus('Settings saved');
      notifyContentScript();
    });
  });

  function updateYearsSettingVisibility() {
    if (enableExtension.checked) {
      yearsSettingItem.classList.remove('disabled');
    } else {
      yearsSettingItem.classList.add('disabled');
    }
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
      chrome.tabs.sendMessage(tabs[0].id, {action: "updateSettings"});
    });
  }
});