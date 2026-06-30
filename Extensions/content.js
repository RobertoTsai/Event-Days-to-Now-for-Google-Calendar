// content.js
let settings = {
  enableExtension: true,
  showYearsForLongPeriods: true,
  yearUnitLabel: 'y',
  dayUnitLabel: 'd',
  hourUnitLabel: 'h'
};
let extensionStarted = false;
let datePrefixUpdateQueued = false;
let extensionContextValid = true;
setPrefixPending(true);

function loadSettings(done = () => {}) {
  if (!canUseExtensionApi()) {
    done(false);
    return;
  }

  try {
    chrome.storage.sync.get(['enableExtension', 'showYearsForLongPeriods', 'yearUnitLabel', 'dayUnitLabel', 'hourUnitLabel'], (result) => {
      try {
        const error = getRuntimeLastError();
        if (error) {
          handleExtensionApiError(error);
          done(false);
          return;
        }

        result = result || {};
        settings = {
          enableExtension: result.enableExtension !== false,
          showYearsForLongPeriods: result.showYearsForLongPeriods !== false,
          yearUnitLabel: getUnitLabel(result.yearUnitLabel, 'y'),
          dayUnitLabel: getUnitLabel(result.dayUnitLabel, 'd'),
          hourUnitLabel: getUnitLabel(result.hourUnitLabel, 'h')
        };
        setPrefixPending(settings.enableExtension);
        done(true);
      } catch (error) {
        handleExtensionApiError(error);
        done(false);
      }
    });
  } catch (error) {
    handleExtensionApiError(error);
    done(false);
  }
}

function getUnitLabel(value, fallback) {
  return String(value ?? '').trim() || fallback;
}

function canUseExtensionApi() {
  try {
    const available = typeof chrome !== 'undefined' && !!chrome.runtime?.id && !!chrome.storage?.sync;
    if (!available) {
      extensionContextValid = false;
      setPrefixPending(false);
    }
    return extensionContextValid && available;
  } catch (error) {
    handleExtensionApiError(error);
    return false;
  }
}

function handleExtensionApiError(error) {
  if (/Extension context invalidated/i.test(error?.message || '')) {
    extensionContextValid = false;
    setPrefixPending(false);
  }
}

function getRuntimeLastError() {
  try {
    return chrome.runtime.lastError;
  } catch (error) {
    handleExtensionApiError(error);
    return error;
  }
}

function addMessageListener() {
  if (!canUseExtensionApi()) return;

  try {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.action === "updateSettings") {
        loadSettings((loaded) => {
          if (loaded) addDatePrefixToEvents();
        });
      }
    });
  } catch (error) {
    handleExtensionApiError(error);
  }
}

function applyLoadedSettings() {
  loadSettings((loaded) => {
    if (loaded) addDatePrefixToEvents();
  });
}

function setPrefixPending(enabled) {
  document.documentElement?.classList?.toggle('date-prefix-pending', enabled);
}

function scheduleDatePrefixUpdate() {
  if (datePrefixUpdateQueued) return;
  datePrefixUpdateQueued = true;

  const schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout;
  schedule(() => {
    datePrefixUpdateQueued = false;
    addDatePrefixToEvents();
  });
}

// 新增的初始化函数
function initializeExtension() {
  console.log("Initializing extension...");
  
  // 设置一个标志来跟踪是否已经初始化
  let initialized = false;
  const startIfCalendarLoaded = (obs) => {
    const calendarLoaded = document.querySelector('[role="grid"]') || document.querySelector('[role="row"]');
    if (calendarLoaded && !initialized) {
      console.log("Calendar loaded, starting extension...");
      initialized = true;
      obs?.disconnect();
      startExtension();
    }
  };

  // 创建一个 MutationObserver 来监视 DOM 变化
  const observer = new MutationObserver((mutations, obs) => startIfCalendarLoaded(obs));

  startIfCalendarLoaded(observer);
  if (initialized) return;

  // 配置 observer
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 主要功能启动函数
function startExtension() {
  if (extensionStarted) return;
  extensionStarted = true;

  applyLoadedSettings();

  // 设置 MutationObserver 来监视后续的变化
  const contentObserver = new MutationObserver(scheduleDatePrefixUpdate);

  contentObserver.observe(document.body, { childList: true, subtree: true });

  // 监听来自 popup 的消息
  addMessageListener();

  // 切换标签时运行函数
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      applyLoadedSettings();
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
  const yearUnitLabel = getUnitLabel(settings.yearUnitLabel, 'y');
  const dayUnitLabel = getUnitLabel(settings.dayUnitLabel, 'd');
  const hourUnitLabel = getUnitLabel(settings.hourUnitLabel, 'h');

  if (settings.showYearsForLongPeriods && absDayDifference >= 365) {
    const years = Math.floor(absDayDifference / 365);
    const remainingDays = absDayDifference % 365;
    return dayDifference < 0
      ? `-${years}${yearUnitLabel}${remainingDays}${dayUnitLabel}`
      : `${years}${yearUnitLabel}${remainingDays}${dayUnitLabel}`;
  }

  if (dayDifference < 0) {
    return `${dayDifference}${dayUnitLabel}`;
  }

  if (!isAllDay && isToday) {
    return `${Math.round(hourDifference)}${hourUnitLabel}`;
  }

  if (isTomorrow) {
    if (isAllDay || hourDifference > 24) {
      return `1${dayUnitLabel}`;
    } else {
      return `${Math.round(hourDifference)}${hourUnitLabel}`;
    }
  }
  
  return `${dayDifference}${dayUnitLabel}`;
}

let localizedMonthCacheKey = '';
let localizedMonthCache = null;
const FALLBACK_LOCALES = [
  'af', 'am', 'ar', 'bg', 'bn', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es',
  'et', 'eu', 'fa', 'fi', 'fil', 'fr', 'gl', 'gu', 'he', 'hi', 'hr', 'hu',
  'id', 'is', 'it', 'ja', 'kn', 'ko', 'lt', 'lv', 'ml', 'mr', 'ms', 'nl',
  'no', 'pl', 'pt', 'ro', 'ru', 'si', 'sk', 'sl', 'sr', 'sv', 'sw', 'ta',
  'te', 'th', 'tr', 'uk', 'ur', 'vi', 'zh'
];
// ponytail: Google Calendar uses Sinhala Gregorian transliterations; add aliases only when Intl names differ.
const MONTH_NAME_ALIASES = [
  ['ජනවාරි', 0], ['පෙබරවාරි', 1], ['මාර්තු', 2], ['අප්‍රේල්', 3], ['මැයි', 4], ['ජූනි', 5],
  ['ජූලි', 6], ['අගෝස්තු', 7], ['සැප්තැම්බර්', 8], ['ඔක්තෝබර්', 9], ['නොවැම්බර්', 10], ['දෙසැම්බර්', 11]
];

function makeLocalDate(year, monthIndex, day) {
  const date = new Date(year, monthIndex, day);
  return date.getFullYear() === year && date.getMonth() === monthIndex && date.getDate() === day ? date : null;
}

function getPageLocales() {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const doc = typeof document !== 'undefined' ? document : {};
  return [...new Set([
    doc.documentElement?.lang,
    nav.language,
    ...(nav.languages || []),
    ...Intl.DateTimeFormat.supportedLocalesOf(FALLBACK_LOCALES),
    'en-US'
  ].filter(Boolean))];
}

function normalizeDateText(text) {
  return String(text).toLocaleLowerCase().replace(/[\u200e\u200f.]/g, '').trim();
}

function getLocalizedMonthNames() {
  const locales = getPageLocales();
  const cacheKey = locales.join('|');
  if (localizedMonthCache && localizedMonthCacheKey === cacheKey) {
    return localizedMonthCache;
  }

  const monthNames = new Map();
  MONTH_NAME_ALIASES.forEach(([name, month]) => monthNames.set(normalizeDateText(name), month));
  locales.forEach((locale) => {
    for (let month = 0; month < 12; month += 1) {
      ['long', 'short'].forEach((monthStyle) => {
        [
          { month: monthStyle },
          { year: 'numeric', month: monthStyle, day: 'numeric' }
        ].forEach((options) => {
          const parts = new Intl.DateTimeFormat(locale, options).formatToParts(new Date(2026, month, 1));
          parts.filter(part => part.type === 'month').forEach((part) => {
            const name = normalizeDateText(part.value);
            if (name && /\D/.test(name)) monthNames.set(name, month);
          });
        });
      });
    }
  });

  localizedMonthCacheKey = cacheKey;
  localizedMonthCache = [...monthNames.entries()].sort((a, b) => b[0].length - a[0].length);
  return localizedMonthCache;
}

function parseMachineDate(value) {
  if (!value) return null;

  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
  if (isoMatch) {
    if (text.length === 10) {
      return makeLocalDate(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    }

    const parsedDate = new Date(text);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const compactMatch = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    return makeLocalDate(parseInt(compactMatch[1]), parseInt(compactMatch[2]) - 1, parseInt(compactMatch[3]));
  }

  if (/^\d{13}$/.test(text)) {
    const parsedDate = new Date(parseInt(text));
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  if (/^\d{10}$/.test(text)) {
    const parsedDate = new Date(parseInt(text) * 1000);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  return null;
}

function parseDateFromElementMetadata(eventElement) {
  const datetimeElement = eventElement.matches?.('[datetime]') ? eventElement : eventElement.querySelector?.('[datetime]');
  const datetimeDate = parseMachineDate(datetimeElement?.getAttribute('datetime'));
  if (datetimeDate) return datetimeDate;

  const dateAttributes = ['data-start-time', 'data-starttime', 'data-start-date', 'data-date', 'data-datekey', 'data-day'];
  for (const attribute of dateAttributes) {
    const ownDate = parseMachineDate(eventElement.getAttribute(attribute));
    if (ownDate) return ownDate;

    const childDate = parseMachineDate(eventElement.querySelector?.(`[${attribute}]`)?.getAttribute(attribute));
    if (childDate) return childDate;
  }

  return null;
}

function parseNumericDateFromString(dateString) {
  const yearFirstMatch = dateString.match(/\b(\d{4})\s*(?:年|년|[./-])\s*(\d{1,2})\s*(?:月|월|[./-])\s*(\d{1,2})/);
  if (yearFirstMatch) {
    return makeLocalDate(parseInt(yearFirstMatch[1]), parseInt(yearFirstMatch[2]) - 1, parseInt(yearFirstMatch[3]));
  }

  const numericMatch = dateString.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);
  if (!numericMatch) return null;

  const first = parseInt(numericMatch[1]);
  const second = parseInt(numericMatch[2]);
  const year = parseInt(numericMatch[3]);
  const preferDayFirst = first > 12 || (second <= 12 && !/^en-US\b/i.test(getPageLocales()[0] || ''));
  const day = preferDayFirst ? first : second;
  const month = preferDayFirst ? second : first;
  return makeLocalDate(year, month - 1, day);
}

function parseLocalizedDateFromString(dateString) {
  const yearMatch = dateString.match(/\b(\d{4})\b/);
  if (!yearMatch) return null;

  const year = parseInt(yearMatch[1]);
  const text = normalizeDateText(dateString);
  const dateMatches = [];

  for (const [monthName, monthIndex] of getLocalizedMonthNames()) {
    let monthPosition = text.indexOf(monthName);
    while (monthPosition !== -1) {
      const beforeMonth = text.slice(0, monthPosition);
      const afterMonth = text.slice(monthPosition + monthName.length);
      const beforeDays = [...beforeMonth.matchAll(/\b(\d{1,2})\b/g)]
        .map(match => ({ day: parseInt(match[1]), distance: monthPosition - match.index }))
        .filter(match => match.day >= 1 && match.day <= 31);
      const afterDays = [...afterMonth.matchAll(/\b(\d{1,2})\b/g)]
        .map(match => ({ day: parseInt(match[1]), distance: match.index }))
        .filter(match => match.day >= 1 && match.day <= 31);
      const dayCandidates = [beforeDays[beforeDays.length - 1], afterDays[0]].filter(Boolean);

      for (const { day, distance } of dayCandidates) {
        const parsedDate = makeLocalDate(year, monthIndex, day);
        if (parsedDate) {
          dateMatches.push({
            date: parsedDate,
            yearDistance: Math.abs(monthPosition - yearMatch.index),
            dayDistance: distance
          });
        }
      }

      monthPosition = text.indexOf(monthName, monthPosition + monthName.length);
    }
  }

  dateMatches.sort((a, b) => a.yearDistance - b.yearDistance || a.dayDistance - b.dayDistance);
  return dateMatches[0]?.date || null;
}

function parseDateFromString(dateString) {
  return parseNumericDateFromString(dateString) || parseLocalizedDateFromString(dateString);
}

function parseTimeFromString(dateString) {
  const timeMatch = dateString.match(/\b(\d{1,2}):(\d{2})\s*([ap]\.?\s?m\.?)?/i);
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  const marker = (timeMatch[3] || '').replace(/[^apm]/gi, '').toLowerCase();
  const isPm = marker === 'pm' || /下午|晚上|午後|오후/.test(dateString);
  const isAm = marker === 'am' || /上午|早上|凌晨|午前|오전/.test(dateString);

  if (isPm && hours < 12) hours += 12;
  if (isAm && hours === 12) hours = 0;
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 ? { hours, minutes } : null;
}

function getPrefixHost(titleElement) {
  const titleSpan = titleElement.querySelector('.WBi6vc') || titleElement.querySelector('.I0UMhf');
  return titleElement.closest?.('.nHqeVd, .uFexlc') || titleElement.querySelector?.('.nHqeVd, .uFexlc') || titleSpan?.closest?.('.nHqeVd, .uFexlc') || titleSpan?.parentNode || titleElement;
}

function setDatePrefix(prefixHost, prefix, isAllDay) {
  prefixHost.querySelector('.date-prefix-span')?.remove();
  prefixHost.classList.add('date-prefix-ready');

  if (!prefix) {
    delete prefixHost.dataset.datePrefix;
    prefixHost.classList.remove('date-prefix-host', 'date-prefix-all-day', 'date-prefix-timed');
    return;
  }

  if (prefixHost.dataset.datePrefix !== prefix) {
    prefixHost.dataset.datePrefix = prefix;
  }

  prefixHost.classList.add('date-prefix-host', isAllDay ? 'date-prefix-all-day' : 'date-prefix-timed');
  prefixHost.classList.remove(isAllDay ? 'date-prefix-timed' : 'date-prefix-all-day');
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
  if (!extensionContextValid) {
    setPrefixPending(false);
    return;
  }

  setPrefixPending(settings.enableExtension);

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
      const ariaLabel = eventElement.getAttribute('aria-label') || titleElement.getAttribute('aria-label') || eventElement.querySelector('.XuJrye')?.textContent;
      eventDate = (ariaLabel ? parseDateFromString(ariaLabel) : null) || parseDateFromElementMetadata(eventElement);

      const eventTime = ariaLabel ? parseTimeFromString(ariaLabel) : null;
      isAllDay = !eventTime && (!eventDate || (eventDate.getHours() === 0 && eventDate.getMinutes() === 0));

      if (eventDate && eventTime) {
        eventDate.setHours(eventTime.hours, eventTime.minutes, 0, 0);
      }
    }

    if (!eventDate || isNaN(eventDate.getTime())) {
      setDatePrefix(getPrefixHost(titleElement), '', false);
      return;
    }

    const isToday = eventDate >= todayStart && eventDate < tomorrowStart;
    const isTomorrow = eventDate >= tomorrowStart && eventDate < dayAfterTomorrowStart;

    const eventDateStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const dayDifference = Math.floor((eventDateStart - todayStart) / (1000 * 60 * 60 * 24));
    const hourDifference = (eventDate - now) / (1000 * 60 * 60);

    const prefix = formatTimeDifference(dayDifference, hourDifference, isAllDay, isToday, isTomorrow);

    setDatePrefix(getPrefixHost(titleElement), prefix, isAllDay);
  });
}

function removeDatePrefixes() {
  document.querySelectorAll('.date-prefix-span').forEach(span => span.remove());
  document.querySelectorAll('.date-prefix-host').forEach((prefixHost) => {
    delete prefixHost.dataset.datePrefix;
    prefixHost.classList.remove('date-prefix-ready', 'date-prefix-host', 'date-prefix-all-day', 'date-prefix-timed');
  });
}
