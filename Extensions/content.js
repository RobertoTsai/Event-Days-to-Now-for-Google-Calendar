// content.js
const DEBOUNCE_DELAY = 600; // milliseconds
const REAPPLY_DELAY = 2000; // milliseconds

let settings = {
  enableExtension: true,
  showYearsForLongPeriods: true
};

function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['enableExtension', 'showYearsForLongPeriods'], (result) => {
      settings = {
        enableExtension: result.enableExtension !== false,
        showYearsForLongPeriods: result.showYearsForLongPeriods !== false
      };
      resolve();
    });
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatTimeDifference(dayDifference, hourDifference, isAllDay, isToday, isTomorrow) {
  if (isToday && (isAllDay || hourDifference <= 0)) {
    return ''; // No prefix for today's all-day events or today's past non-all-day events
  }

  const absDayDifference = Math.abs(dayDifference);

  if (settings.showYearsForLongPeriods && absDayDifference >= 365) {
    const years = Math.floor(absDayDifference / 365);
    const remainingDays = absDayDifference % 365;
    return dayDifference < 0 ? 
      `-${years}y${remainingDays}d` : 
      `${years}y${remainingDays}d`;
  }

  if (dayDifference < 0) {
    return `${dayDifference}d`;
  }

  if (!isAllDay && isToday) {
    return `${Math.round(hourDifference)}h`;
  }

  if (isTomorrow) {
    if (isAllDay || hourDifference > 24) {
      return '1d';
    } else {
      return `${Math.round(hourDifference)}h`;
    }
  }
  
  return `${dayDifference}d`;
}
function parseDateFromString(dateString) {
  // Chinese date format: 2024年7月10日
  // Japanese date format: 2024年 7月 10日
  const chineseMatch = dateString.match(/(\d{4})年\s{0,1}(\d{1,2})月\s{0,1}(\d{1,2})日/);
  if (chineseMatch) {
    return new Date(
      parseInt(chineseMatch[1]),
      parseInt(chineseMatch[2]) - 1,
      parseInt(chineseMatch[3])
    );
  }

  // Korean date format: 2024년 7월 10일
  const koreanMatch = dateString.match(/(\d{4})년\s{0,1}(\d{1,2})월\s{0,1}(\d{1,2})일/);
  if (koreanMatch) {
    return new Date(
      parseInt(koreanMatch[1]),
      parseInt(koreanMatch[2]) - 1,
      parseInt(koreanMatch[3])
    );
  }

  // English date format: July 10, 2024
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const englishMatch = dateString.match(/(?:.*,\s)(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:\s[–\d\s\w]*)?,\s+(\d{4})$/i);
  if (englishMatch) {
    const monthIndex = months.indexOf(englishMatch[1]);
    if (monthIndex !== -1) {
      return new Date(
        parseInt(englishMatch[3]),
        monthIndex,
        parseInt(englishMatch[2])
      );
    }
  }
  else {
    const regex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\b/g;
    const englishMatch2 = regex.exec(dateString);
    if (englishMatch2){
      const monthIndex2 = months.indexOf(englishMatch2[1]);
    if (monthIndex2 !== -1) {
        return new Date(
          parseInt(englishMatch2[3]),
          monthIndex2,
          parseInt(englishMatch2[2])
        );
      }
    }
  }

  return null;
}

function addDatePrefixToEvents() {
  if (!settings.enableExtension) {
    removeDatePrefixes();
    return;
  }

  const now = new Date();
  now.setSeconds(0);
  now.setMilliseconds(0);
  
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const dayAfterTomorrowStart = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);
  
  const eventElements = document.querySelectorAll('[data-eventid]');

  eventElements.forEach((eventElement) => {
    let titleElement = eventElement.querySelector('.WBi6vc') || eventElement;
    if (!titleElement) return;

    let eventDate;
    let isAllDay = false;
    
    const ariaLabel = eventElement.getAttribute('aria-label') || eventElement.querySelector('.XuJrye')?.textContent;
    if (ariaLabel) {
      // Extract date string
      const dateString = ariaLabel;
      eventDate = parseDateFromString(dateString);

      // Check if it's an all-day event
      isAllDay = !ariaLabel.match(/\d{1,2}:\d{2}/);

      if (!isAllDay && eventDate) {
        // If not an all-day event, extract time
        const timeMatch = ariaLabel.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          eventDate.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]));
        }
      }
    }

    if (!eventDate || isNaN(eventDate.getTime())) return;

    const isToday = eventDate >= todayStart && eventDate < tomorrowStart;
    const isTomorrow = eventDate >= tomorrowStart && eventDate < dayAfterTomorrowStart;

    const eventDateStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const dayDifference = Math.floor((eventDateStart - todayStart) / (1000 * 60 * 60 * 24));
    const hourDifference = (eventDate - now) / (1000 * 60 * 60);

    const prefix = formatTimeDifference(dayDifference, hourDifference, isAllDay, isToday, isTomorrow);

    if (prefix) {
      const newPrefix = `(${prefix}) `;
      if (!titleElement.textContent.startsWith(newPrefix)) {
        const originalText = titleElement.textContent.replace(/^\([^)]+\) /, '');
        titleElement.textContent = newPrefix + originalText;

        // Reapply prefix after a delay
        setTimeout(() => {
          if (!titleElement.textContent.startsWith(newPrefix)) {
            titleElement.textContent = newPrefix + titleElement.textContent.replace(/^\([^)]+\) /, '');
          }
        }, REAPPLY_DELAY);
      }
    } else {
      // Remove prefix for today's all-day events and past events
      titleElement.textContent = titleElement.textContent.replace(/^\([^)]+\) /, '');
    }
  });
}

function removeDatePrefixes() {
  const eventElements = document.querySelectorAll('[data-eventid]');
  eventElements.forEach((eventElement) => {
    let titleElement = eventElement.querySelector('.WBi6vc') || eventElement;
    if (titleElement) {
      titleElement.textContent = titleElement.textContent.replace(/^\([^)]+\) /, '');
    }
  });
}

const debouncedAddDatePrefix = debounce(() => {
  addDatePrefixToEvents();
  // Reapply after a delay to ensure it persists
  setTimeout(addDatePrefixToEvents, REAPPLY_DELAY);
}, DEBOUNCE_DELAY);

// Use MutationObserver to detect changes in the DOM
const observer = new MutationObserver((mutations) => {
  let shouldUpdate = false;
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' || 
        (mutation.type === 'attributes' && mutation.attributeName === 'data-eventid')) {
      shouldUpdate = true;
    }
  });
  if (shouldUpdate) {
    debouncedAddDatePrefix();
  }
});

// Start observing the document with the configured parameters
observer.observe(document.body, { 
  childList: true, 
  subtree: true, 
  attributes: true, 
  attributeFilter: ['data-eventid'] 
});

// Initial run
loadSettings().then(() => {
  debouncedAddDatePrefix();
});

// Add event listener for URL changes
let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    debouncedAddDatePrefix();
  }
}).observe(document, {subtree: true, childList: true});

// Run the function when switching tabs
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadSettings().then(() => {
      debouncedAddDatePrefix();
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "updateSettings") {
      loadSettings().then(() => {
        addDatePrefixToEvents();
      });
    }
  }
);