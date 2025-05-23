// content.js
const DEBOUNCE_DELAY = 600; // milliseconds

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

// 新增的初始化函数
function initializeExtension() {
  console.log("Initializing extension...");
  
  // 设置一个标志来跟踪是否已经初始化
  let initialized = false;

  // 创建一个 MutationObserver 来监视 DOM 变化
  const observer = new MutationObserver((mutations, obs) => {
    // 检查页面是否已经加载完毕
    const calendarLoaded = document.querySelector('[role="grid"]') || document.querySelector('[role="row"]');
    if (calendarLoaded && !initialized) {
      console.log("Calendar loaded, starting extension...");
      initialized = true;
      
      // 停止观察
      obs.disconnect();
      
      // 开始执行我们的主要功能
      startExtension();
    }
  });

  // 配置 observer
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 主要功能启动函数
function startExtension() {
  loadSettings().then(() => {
    addDatePrefixToEvents();
    
    // 设置 MutationObserver 来监视后续的变化
    const contentObserver = new MutationObserver(debounce(() => {
      loadSettings().then(() => {
        addDatePrefixToEvents();
      });
    }, DEBOUNCE_DELAY));

    contentObserver.observe(document.body, { childList: true, subtree: true });
  });

  // 监听来自 popup 的消息
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.action === "updateSettings") {
        loadSettings().then(() => {
          addDatePrefixToEvents();
        });
      }
    }
  );

  // 切换标签时运行函数
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadSettings().then(() => {
        addDatePrefixToEvents();
      });
    }
  });
}

// 当文档加载完成时启动初始化过程
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
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
    //Fixed a parsing issue where the date is in front of the event name.
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

// 从生日事件的 eventId 中提取日期
function parseDateFromBirthdayEventId(eventId) {
  if (!eventId || !eventId.startsWith('bday_')) {
    return null;
  }
  
  try {
    // 去掉 'bday_' 前缀
    const base64Part = eventId.substring(5);
    // Base64 解码
    const decodedString = atob(base64Part);
    // 查找格式为 _YYYYMMDD 的日期
    const dateMatch = decodedString.match(/_(\d{8})/);
    
    if (dateMatch && dateMatch[1]) {
      const dateStr = dateMatch[1];
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1; // 月份从0开始
      const day = parseInt(dateStr.substring(6, 8));
      
      return new Date(year, month, day);
    }
  } catch (error) {
    console.error('Error parsing birthday date from eventId:', error);
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
    let titleElement = eventElement.querySelector('.WBi6vc') || eventElement.querySelector('[role="button"]') || eventElement;
    if (!titleElement) return;

    let eventDate;
    let isAllDay = false;
    
    // 获取 data-eventid 属性值
    const eventId = eventElement.getAttribute('data-eventid');
    
    // 检查是否为生日事件
    if (eventId && eventId.startsWith('bday_')) {
      // 从生日事件ID中提取日期
      eventDate = parseDateFromBirthdayEventId(eventId);
      // 生日事件通常是全天事件
      isAllDay = true;
    } else {
      // 使用原来的方式解析日期
      const ariaLabel = eventElement.getAttribute('aria-label') || titleElement.getAttribute('aria-label') || eventElement.querySelector('.XuJrye')?.textContent;
      if (ariaLabel) {
        const dateString = ariaLabel;
        eventDate = parseDateFromString(dateString);
        isAllDay = !ariaLabel.match(/\d{1,2}:\d{2}/);

        if (!isAllDay && eventDate) {
          const timeMatch = ariaLabel.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            eventDate.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]));
          }
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

    // 檢查現有的前綴 span
    let prefixSpan = titleElement.querySelector('.date-prefix-span');
    let titleSpan = titleElement.querySelector('.WBi6vc') || titleElement.querySelector('.I0UMhf');

    if (prefix) {
      const newPrefix = `${prefix}`;
      
      if (prefixSpan) {
        // 更新現有前綴 span 的內容（如果已更改）
        if (prefixSpan.textContent !== newPrefix) {
          prefixSpan.textContent = newPrefix;
        }
      } else {
        // 創建新的前綴 span（如果不存在）
        prefixSpan = document.createElement('span');
        prefixSpan.textContent = newPrefix;
        
        // 將前綴插入到標題之前
        if (titleSpan) {
          titleSpan.parentNode.insertBefore(prefixSpan, titleSpan);
        } else {
          titleElement.insertBefore(prefixSpan, titleElement.firstChild);
        }
      }
      
      // 更新類別基於事件類型
      prefixSpan.className = isAllDay ? 'date-prefix-span date-prefix-all-day' : 'date-prefix-span date-prefix-timed';
      
    } else if (prefixSpan) {
      // 如果前綴不應存在但存在，則移除它
      prefixSpan.remove();
    }
  });
}

function removeDatePrefixes() {
  const prefixSpans = document.querySelectorAll('.date-prefix-span');
  prefixSpans.forEach(span => span.remove());
}

// Initial load of settings and application of prefixes
loadSettings().then(() => {
  addDatePrefixToEvents();
});

// Set up MutationObserver to watch for changes
const observer = new MutationObserver(debounce(() => {
  loadSettings().then(() => {
    addDatePrefixToEvents();
  });
}, DEBOUNCE_DELAY));

observer.observe(document.body, { childList: true, subtree: true });

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

// Run the function when switching tabs
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadSettings().then(() => {
      addDatePrefixToEvents();
    });
  }
});