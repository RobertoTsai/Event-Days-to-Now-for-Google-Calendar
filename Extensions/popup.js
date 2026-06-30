// popup.js
document.addEventListener('DOMContentLoaded', function() {
  var enableExtension = document.getElementById('enableExtension');
  var showYearsForLongPeriods = document.getElementById('showYearsForLongPeriods');
  var yearsSettingItem = document.getElementById('yearsSettingItem');
  var unitLabelsSettingItem = document.getElementById('unitLabelsSettingItem');
  var yearUnitLabel = document.getElementById('yearUnitLabel');
  var dayUnitLabel = document.getElementById('dayUnitLabel');
  var hourUnitLabel = document.getElementById('hourUnitLabel');
  var displayLanguage = document.getElementById('displayLanguage');
  var yearsExampleOn = document.getElementById('yearsExampleOn');
  var yearsExampleOff = document.getElementById('yearsExampleOff');
  var yearsExampleOnPrefix = document.getElementById('yearsExampleOnPrefix');
  var yearsExampleOffPrefix = document.getElementById('yearsExampleOffPrefix');
  var status = document.getElementById('status');
  var currentLanguage = 'en';

  var supportedLanguages = ['en', 'zh-TW', 'zh-CN', 'es', 'ar', 'hi', 'pt', 'bn', 'ru', 'ja', 'de', 'fr', 'ko'];
  var languageNames = {
    en: 'English',
    'zh-TW': '繁體中文',
    'zh-CN': '简体中文',
    es: 'Español',
    ar: 'العربية',
    hi: 'हिन्दी',
    pt: 'Português',
    bn: 'বাংলা',
    ru: 'Русский',
    ja: '日本語',
    de: 'Deutsch',
    fr: 'Français',
    ko: '한국어'
  };
  var messages = {
    en: {
      documentTitle: 'Date Prefixer Settings',
      subtitle: 'Google Calendar event countdown settings',
      enableLabel: 'Enable Date Prefixer',
      enableDescription: 'Add day or hour prefixes before event titles.',
      showYearsLabel: 'Show years for long periods',
      showYearsDescription: 'For events 365+ days away, shorten long day counts.',
      showYearsExamples: 'Show years examples',
      onLabel: 'On',
      offLabel: 'Off',
      daysAwayNote: '370 days away',
      sameEventNote: 'Same event',
      prefixTextLabel: 'Prefix text',
      prefixTextDescription: 'Customize the labels used after year, day, and hour numbers.',
      yearLabel: 'Year',
      dayLabel: 'Day',
      hourLabel: 'Hour',
      languageLabel: 'Language',
      languageDescription: 'Choose the popup display language.',
      autoLanguageOption: 'Auto (browser language)',
      settingsSaved: 'Settings saved'
    },
    'zh-TW': {
      documentTitle: 'Date Prefixer 設定',
      subtitle: 'Google 日曆事件倒數設定',
      enableLabel: '啟用 Date Prefixer',
      enableDescription: '在事件標題前加入天數或時數前綴。',
      showYearsLabel: '長期間顯示年數',
      showYearsDescription: '365 天以上的事件，縮短過長的天數顯示。',
      showYearsExamples: '顯示年數範例',
      onLabel: '開',
      offLabel: '關',
      daysAwayNote: '距離 370 天',
      sameEventNote: '同一個事件',
      prefixTextLabel: '前綴文字',
      prefixTextDescription: '自訂年、日、時數字後方的文字。',
      yearLabel: '年',
      dayLabel: '日',
      hourLabel: '時',
      languageLabel: '語言',
      languageDescription: '選擇設定視窗顯示語言。',
      autoLanguageOption: '自動（瀏覽器語言）',
      settingsSaved: '設定已儲存'
    },
    'zh-CN': {
      documentTitle: 'Date Prefixer 设置',
      subtitle: 'Google 日历事件倒计时设置',
      enableLabel: '启用 Date Prefixer',
      enableDescription: '在事件标题前添加天数或小时前缀。',
      showYearsLabel: '长时间段显示年数',
      showYearsDescription: '365 天以上的事件，缩短过长的天数显示。',
      showYearsExamples: '显示年数示例',
      onLabel: '开',
      offLabel: '关',
      daysAwayNote: '距离 370 天',
      sameEventNote: '同一个事件',
      prefixTextLabel: '前缀文字',
      prefixTextDescription: '自定义年、日、小时数字后的文字。',
      yearLabel: '年',
      dayLabel: '日',
      hourLabel: '时',
      languageLabel: '语言',
      languageDescription: '选择设置窗口显示语言。',
      autoLanguageOption: '自动（浏览器语言）',
      settingsSaved: '设置已保存'
    },
    es: {
      documentTitle: 'Configuración de Date Prefixer',
      subtitle: 'Configuración de cuenta regresiva para Google Calendar',
      enableLabel: 'Activar Date Prefixer',
      enableDescription: 'Agrega prefijos de días u horas antes de los títulos.',
      showYearsLabel: 'Mostrar años en periodos largos',
      showYearsDescription: 'Para eventos a 365+ días, acorta los conteos largos.',
      showYearsExamples: 'Ejemplos de años',
      onLabel: 'Sí',
      offLabel: 'No',
      daysAwayNote: 'Faltan 370 días',
      sameEventNote: 'Mismo evento',
      prefixTextLabel: 'Texto del prefijo',
      prefixTextDescription: 'Personaliza el texto después de años, días y horas.',
      yearLabel: 'Año',
      dayLabel: 'Día',
      hourLabel: 'Hora',
      languageLabel: 'Idioma',
      languageDescription: 'Elige el idioma del popup.',
      autoLanguageOption: 'Auto (idioma del navegador)',
      settingsSaved: 'Configuración guardada'
    },
    ar: {
      documentTitle: 'إعدادات Date Prefixer',
      subtitle: 'إعدادات العد التنازلي لأحداث تقويم Google',
      enableLabel: 'تفعيل Date Prefixer',
      enableDescription: 'إضافة بادئات الأيام أو الساعات قبل عناوين الأحداث.',
      showYearsLabel: 'عرض السنوات للفترات الطويلة',
      showYearsDescription: 'للأحداث بعد 365 يومًا أو أكثر، اختصر عدد الأيام الطويل.',
      showYearsExamples: 'أمثلة عرض السنوات',
      onLabel: 'تشغيل',
      offLabel: 'إيقاف',
      daysAwayNote: 'بعد 370 يومًا',
      sameEventNote: 'نفس الحدث',
      prefixTextLabel: 'نص البادئة',
      prefixTextDescription: 'خصص النص بعد أرقام السنوات والأيام والساعات.',
      yearLabel: 'سنة',
      dayLabel: 'يوم',
      hourLabel: 'ساعة',
      languageLabel: 'اللغة',
      languageDescription: 'اختر لغة عرض النافذة.',
      autoLanguageOption: 'تلقائي (لغة المتصفح)',
      settingsSaved: 'تم حفظ الإعدادات'
    },
    hi: {
      documentTitle: 'Date Prefixer सेटिंग्स',
      subtitle: 'Google Calendar इवेंट काउंटडाउन सेटिंग्स',
      enableLabel: 'Date Prefixer चालू करें',
      enableDescription: 'इवेंट शीर्षक से पहले दिन या घंटे का प्रीफिक्स जोड़ें।',
      showYearsLabel: 'लंबी अवधि में वर्ष दिखाएं',
      showYearsDescription: '365+ दिन दूर इवेंट के लिए लंबे दिन गिनती को छोटा करें।',
      showYearsExamples: 'वर्ष दिखाने के उदाहरण',
      onLabel: 'चालू',
      offLabel: 'बंद',
      daysAwayNote: '370 दिन दूर',
      sameEventNote: 'वही इवेंट',
      prefixTextLabel: 'प्रीफिक्स टेक्स्ट',
      prefixTextDescription: 'वर्ष, दिन और घंटे की संख्या के बाद का टेक्स्ट बदलें।',
      yearLabel: 'वर्ष',
      dayLabel: 'दिन',
      hourLabel: 'घंटा',
      languageLabel: 'भाषा',
      languageDescription: 'पॉपअप की भाषा चुनें।',
      autoLanguageOption: 'ऑटो (ब्राउज़र भाषा)',
      settingsSaved: 'सेटिंग्स सेव हो गईं'
    },
    pt: {
      documentTitle: 'Configurações do Date Prefixer',
      subtitle: 'Configurações de contagem regressiva do Google Agenda',
      enableLabel: 'Ativar Date Prefixer',
      enableDescription: 'Adiciona prefixos de dias ou horas antes dos títulos.',
      showYearsLabel: 'Mostrar anos em períodos longos',
      showYearsDescription: 'Para eventos a 365+ dias, encurta contagens longas.',
      showYearsExamples: 'Exemplos de anos',
      onLabel: 'Ligado',
      offLabel: 'Desligado',
      daysAwayNote: '370 dias restantes',
      sameEventNote: 'Mesmo evento',
      prefixTextLabel: 'Texto do prefixo',
      prefixTextDescription: 'Personalize o texto após números de anos, dias e horas.',
      yearLabel: 'Ano',
      dayLabel: 'Dia',
      hourLabel: 'Hora',
      languageLabel: 'Idioma',
      languageDescription: 'Escolha o idioma do popup.',
      autoLanguageOption: 'Auto (idioma do navegador)',
      settingsSaved: 'Configurações salvas'
    },
    bn: {
      documentTitle: 'Date Prefixer সেটিংস',
      subtitle: 'Google Calendar ইভেন্ট কাউন্টডাউন সেটিংস',
      enableLabel: 'Date Prefixer চালু করুন',
      enableDescription: 'ইভেন্ট শিরোনামের আগে দিন বা ঘণ্টার প্রিফিক্স যোগ করুন।',
      showYearsLabel: 'দীর্ঘ সময়ে বছর দেখান',
      showYearsDescription: '365+ দিন দূরের ইভেন্টে দীর্ঘ দিনের সংখ্যা ছোট করুন।',
      showYearsExamples: 'বছর দেখানোর উদাহরণ',
      onLabel: 'চালু',
      offLabel: 'বন্ধ',
      daysAwayNote: '370 দিন বাকি',
      sameEventNote: 'একই ইভেন্ট',
      prefixTextLabel: 'প্রিফিক্স টেক্সট',
      prefixTextDescription: 'বছর, দিন এবং ঘণ্টার সংখ্যার পরের লেখা বদলান।',
      yearLabel: 'বছর',
      dayLabel: 'দিন',
      hourLabel: 'ঘণ্টা',
      languageLabel: 'ভাষা',
      languageDescription: 'পপআপের ভাষা বেছে নিন।',
      autoLanguageOption: 'স্বয়ংক্রিয় (ব্রাউজারের ভাষা)',
      settingsSaved: 'সেটিংস সংরক্ষিত'
    },
    ru: {
      documentTitle: 'Настройки Date Prefixer',
      subtitle: 'Настройки обратного отсчета для Google Календаря',
      enableLabel: 'Включить Date Prefixer',
      enableDescription: 'Добавляет дни или часы перед названиями событий.',
      showYearsLabel: 'Показывать годы для длинных периодов',
      showYearsDescription: 'Для событий дальше 365 дней сокращает длинный счет дней.',
      showYearsExamples: 'Примеры отображения лет',
      onLabel: 'Вкл.',
      offLabel: 'Выкл.',
      daysAwayNote: 'Через 370 дней',
      sameEventNote: 'То же событие',
      prefixTextLabel: 'Текст префикса',
      prefixTextDescription: 'Настройте текст после чисел лет, дней и часов.',
      yearLabel: 'Год',
      dayLabel: 'День',
      hourLabel: 'Час',
      languageLabel: 'Язык',
      languageDescription: 'Выберите язык окна настроек.',
      autoLanguageOption: 'Авто (язык браузера)',
      settingsSaved: 'Настройки сохранены'
    },
    ja: {
      documentTitle: 'Date Prefixer 設定',
      subtitle: 'Google カレンダーのイベントカウントダウン設定',
      enableLabel: 'Date Prefixer を有効にする',
      enableDescription: 'イベント名の前に日数または時間の接頭辞を追加します。',
      showYearsLabel: '長期間は年数を表示',
      showYearsDescription: '365 日以上先のイベントの長い日数表示を短くします。',
      showYearsExamples: '年数表示の例',
      onLabel: 'オン',
      offLabel: 'オフ',
      daysAwayNote: '370 日先',
      sameEventNote: '同じイベント',
      prefixTextLabel: '接頭辞テキスト',
      prefixTextDescription: '年、日、時間の数字の後ろに表示する文字を変更します。',
      yearLabel: '年',
      dayLabel: '日',
      hourLabel: '時間',
      languageLabel: '言語',
      languageDescription: 'ポップアップの表示言語を選択します。',
      autoLanguageOption: '自動（ブラウザーの言語）',
      settingsSaved: '設定を保存しました'
    },
    de: {
      documentTitle: 'Date Prefixer Einstellungen',
      subtitle: 'Countdown-Einstellungen für Google Kalender',
      enableLabel: 'Date Prefixer aktivieren',
      enableDescription: 'Fügt Tages- oder Stundenpräfixe vor Ereignistiteln hinzu.',
      showYearsLabel: 'Jahre für lange Zeiträume anzeigen',
      showYearsDescription: 'Kürzt lange Tageszahlen für Ereignisse ab 365 Tagen.',
      showYearsExamples: 'Beispiele für Jahre',
      onLabel: 'Ein',
      offLabel: 'Aus',
      daysAwayNote: '370 Tage entfernt',
      sameEventNote: 'Dasselbe Ereignis',
      prefixTextLabel: 'Präfixtext',
      prefixTextDescription: 'Passe den Text nach Jahres-, Tages- und Stundenzahlen an.',
      yearLabel: 'Jahr',
      dayLabel: 'Tag',
      hourLabel: 'Stunde',
      languageLabel: 'Sprache',
      languageDescription: 'Wähle die Anzeigesprache des Popups.',
      autoLanguageOption: 'Auto (Browsersprache)',
      settingsSaved: 'Einstellungen gespeichert'
    },
    fr: {
      documentTitle: 'Paramètres de Date Prefixer',
      subtitle: 'Paramètres de compte à rebours Google Agenda',
      enableLabel: 'Activer Date Prefixer',
      enableDescription: 'Ajoute des préfixes en jours ou heures avant les titres.',
      showYearsLabel: 'Afficher les années pour les longues durées',
      showYearsDescription: 'Pour les événements à 365+ jours, raccourcit les longs comptes.',
      showYearsExamples: 'Exemples avec années',
      onLabel: 'Activé',
      offLabel: 'Désactivé',
      daysAwayNote: 'Dans 370 jours',
      sameEventNote: 'Même événement',
      prefixTextLabel: 'Texte du préfixe',
      prefixTextDescription: 'Personnalisez le texte après les années, jours et heures.',
      yearLabel: 'Année',
      dayLabel: 'Jour',
      hourLabel: 'Heure',
      languageLabel: 'Langue',
      languageDescription: 'Choisissez la langue du popup.',
      autoLanguageOption: 'Auto (langue du navigateur)',
      settingsSaved: 'Paramètres enregistrés'
    },
    ko: {
      documentTitle: 'Date Prefixer 설정',
      subtitle: 'Google Calendar 이벤트 카운트다운 설정',
      enableLabel: 'Date Prefixer 사용',
      enableDescription: '이벤트 제목 앞에 일 또는 시간 접두사를 추가합니다.',
      showYearsLabel: '긴 기간에 연도 표시',
      showYearsDescription: '365일 이상 남은 이벤트의 긴 일수 표시를 줄입니다.',
      showYearsExamples: '연도 표시 예시',
      onLabel: '켜짐',
      offLabel: '꺼짐',
      daysAwayNote: '370일 남음',
      sameEventNote: '같은 이벤트',
      prefixTextLabel: '접두사 텍스트',
      prefixTextDescription: '년, 일, 시간 숫자 뒤의 텍스트를 바꿉니다.',
      yearLabel: '년',
      dayLabel: '일',
      hourLabel: '시간',
      languageLabel: '언어',
      languageDescription: '팝업 표시 언어를 선택합니다.',
      autoLanguageOption: '자동 (브라우저 언어)',
      settingsSaved: '설정이 저장되었습니다'
    }
  };

  populateLanguageOptions();

  // Load saved settings
  chrome.storage.sync.get([
    'enableExtension',
    'showYearsForLongPeriods',
    'yearUnitLabel',
    'dayUnitLabel',
    'hourUnitLabel',
    'displayLanguage'
  ], function(items) {
    if (chrome.runtime.lastError) return;
    items = items || {};
    displayLanguage.value = getStoredLanguage(items.displayLanguage);
    applyLanguage(resolveLanguage(displayLanguage.value));
    enableExtension.checked = items.enableExtension !== false; // Default to true
    showYearsForLongPeriods.checked = items.showYearsForLongPeriods !== false; // Default to true
    yearUnitLabel.value = getUnitLabel(items.yearUnitLabel, 'y');
    dayUnitLabel.value = getUnitLabel(items.dayUnitLabel, 'd');
    hourUnitLabel.value = getUnitLabel(items.hourUnitLabel, 'h');
    updateYearsSettingVisibility();
  });

  // Save settings when controls are changed
  enableExtension.addEventListener('change', function() {
    chrome.storage.sync.set({ enableExtension: enableExtension.checked }, function() {
      if (chrome.runtime.lastError) return;
      updateYearsSettingVisibility();
      updateStatus(getMessage('settingsSaved'));
      notifyContentScript();
    });
  });

  showYearsForLongPeriods.addEventListener('change', function() {
    chrome.storage.sync.set({ showYearsForLongPeriods: showYearsForLongPeriods.checked }, function() {
      if (chrome.runtime.lastError) return;
      updateYearsExampleState();
      updateStatus(getMessage('settingsSaved'));
      notifyContentScript();
    });
  });

  displayLanguage.addEventListener('change', function() {
    applyLanguage(resolveLanguage(displayLanguage.value));
    chrome.storage.sync.set({ displayLanguage: displayLanguage.value }, function() {
      if (chrome.runtime.lastError) return;
      updateStatus(getMessage('settingsSaved'));
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
      updateStatus(getMessage('settingsSaved'));
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

  function populateLanguageOptions() {
    displayLanguage.appendChild(createLanguageOption('auto', messages.en.autoLanguageOption));
    supportedLanguages.forEach(function(language) {
      displayLanguage.appendChild(createLanguageOption(language, languageNames[language]));
    });
  }

  function createLanguageOption(value, label) {
    var option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    return option;
  }

  function applyLanguage(language) {
    currentLanguage = language;
    var text = messages[currentLanguage] || messages.en;
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    document.title = text.documentTitle;
    document.querySelectorAll('[data-i18n]').forEach(function(element) {
      element.textContent = getTranslatedText(text, element.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(element) {
      element.title = getTranslatedText(text, element.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function(element) {
      element.setAttribute('aria-label', getTranslatedText(text, element.dataset.i18nAriaLabel));
    });
    displayLanguage.options[0].textContent = text.autoLanguageOption;
  }

  function getTranslatedText(text, key) {
    return text[key] || messages.en[key] || '';
  }

  function resolveLanguage(language) {
    if (language !== 'auto') return normalizeSupportedLanguage(language) || 'en';
    var browserLanguages = (navigator.languages || [navigator.language || 'en']).filter(Boolean);
    for (var i = 0; i < browserLanguages.length; i += 1) {
      var matchedLanguage = normalizeSupportedLanguage(browserLanguages[i]);
      if (matchedLanguage) return matchedLanguage;
    }
    return 'en';
  }

  function normalizeSupportedLanguage(language) {
    var normalized = String(language || '').replace('_', '-').toLowerCase();
    if (!normalized) return '';
    if (normalized.indexOf('zh') === 0) {
      if (/^zh-(tw|hk|mo|hant)/.test(normalized)) return 'zh-TW';
      return 'zh-CN';
    }
    var exactLanguage = supportedLanguages.find(function(supportedLanguage) {
      return supportedLanguage.toLowerCase() === normalized;
    });
    if (exactLanguage) return exactLanguage;
    var baseLanguage = normalized.split('-')[0];
    return supportedLanguages.indexOf(baseLanguage) !== -1 ? baseLanguage : '';
  }

  function getStoredLanguage(language) {
    if (language === 'auto') return 'auto';
    return normalizeSupportedLanguage(language) || 'auto';
  }

  function getMessage(key) {
    return (messages[currentLanguage] && messages[currentLanguage][key]) || messages.en[key] || '';
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
