const STORAGE_KEY = "habits.v1";
const TYPE_LABELS = {
  daily: "Daily checkoff",
  weekly: "Weekly checkoff",
  minutes: "Weekly minutes"
};
const THEME_MODES = ["dark", "light", "system"];
const MOODS = ["good", "neutral", "bad"];
const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const HABIT_COLORS = {
  cyan: { label: "Cyan", value: "#22d3ee" },
  violet: { label: "Violet", value: "#8b5cf6" },
  rose: { label: "Rose", value: "#fb7185" },
  amber: { label: "Amber", value: "#f59e0b" },
  emerald: { label: "Emerald", value: "#10b981" },
  sky: { label: "Sky", value: "#38bdf8" }
};
const HABIT_ICONS = {
  star: {
    label: "Star",
    svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>'
  },
  book: {
    label: "Book",
    svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h8a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H5V4.5Zm14 0h-3a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h3v-12Z"/></svg>'
  },
  pulse: {
    label: "Flex",
    glyph: "💪"
  },
  bolt: {
    label: "Bolt",
    svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z"/></svg>'
  },
  moon: {
    label: "Moon",
    svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a7.8 7.8 0 1 0 11.5 11.5Z"/></svg>'
  },
  droplet: {
    label: "Drop",
    svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11Z"/></svg>'
  },
  shoe: {
    label: "Run",
    glyph: "🏃‍♂️"
  },
  pen: {
    label: "Pen",
    svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16.8 1.2 3.2 3.2-1.2L19.5 7.7 15.1 3.3 4 14.4v2.4Z"/></svg>'
  }
};
const DEFAULT_HABIT_COLOR = "cyan";
const DEFAULT_HABIT_ICON = "star";

const state = loadState();
const calendarState = {
  month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  selectedHabitId: null
};
const trackerState = {
  visibleWeekStart: null,
  editingHabitId: null,
  draftColor: DEFAULT_HABIT_COLOR,
  draftIcon: DEFAULT_HABIT_ICON
};

const els = {};
let installPrompt = null;
let toastTimer = null;
let diaryTimer = null;
let pendingConfirmation = null;
let pendingEdit = null;

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  render();
  registerServiceWorker();
});

function cacheElements() {
  Object.assign(els, {
    currentDate: document.querySelector("#current-date"),
    fileWarning: document.querySelector("#file-warning"),
    offlineBanner: document.querySelector("#offline-banner"),
    weekOrbit: document.querySelector("#week-orbit"),
    weekPercent: document.querySelector("#week-percent"),
    weekTitle: document.querySelector("#week-title"),
    weekCopy: document.querySelector("#week-copy"),
    trackerWeekLabel: document.querySelector("#tracker-week-label"),
    prevWeek: document.querySelector("#prev-week"),
    nextWeek: document.querySelector("#next-week"),
    currentWeek: document.querySelector("#current-week"),
    weekStrip: document.querySelector("#week-strip"),
    diaryWeekLabel: document.querySelector("#diary-week-label"),
    diaryMood: document.querySelector("#diary-mood"),
    diaryNote: document.querySelector("#diary-note"),
    habitList: document.querySelector("#habit-list"),
    habitPicker: document.querySelector("#habit-picker"),
    streakPanel: document.querySelector("#streak-panel"),
    calendarTitle: document.querySelector("#calendar-title"),
    calendarWeekdays: document.querySelector(".calendar-weekdays"),
    calendarGrid: document.querySelector("#calendar-grid"),
    prevMonth: document.querySelector("#prev-month"),
    nextMonth: document.querySelector("#next-month"),
    dialog: document.querySelector("#habit-dialog"),
    form: document.querySelector("#habit-form"),
    habitDialogKicker: document.querySelector("#habit-dialog-kicker"),
    habitDialogTitle: document.querySelector("#habit-dialog-title"),
    habitName: document.querySelector("#habit-name"),
    typeLockNote: document.querySelector("#type-lock-note"),
    targetField: document.querySelector("#target-field"),
    targetLabel: document.querySelector("#target-label"),
    habitTarget: document.querySelector("#habit-target"),
    habitIconPicker: document.querySelector("#habit-icon-picker"),
    habitColorPicker: document.querySelector("#habit-color-picker"),
    weekStartSetting: document.querySelector("#week-start-setting"),
    themeSetting: document.querySelector("#theme-setting"),
    backupStatus: document.querySelector("#backup-status"),
    floatingAdd: document.querySelector("#floating-add"),
    quickAdd: document.querySelector("#quick-add-button"),
    installButton: document.querySelector("#install-button"),
    exportJson: document.querySelector("#export-json"),
    exportCsv: document.querySelector("#export-csv"),
    importJson: document.querySelector("#import-json"),
    importCsv: document.querySelector("#import-csv"),
    clearData: document.querySelector("#clear-data"),
    editEntryDialog: document.querySelector("#edit-entry-dialog"),
    editEntryForm: document.querySelector("#edit-entry-form"),
    editEntryTitle: document.querySelector("#edit-entry-title"),
    editEntryCopy: document.querySelector("#edit-entry-copy"),
    editMinutesInput: document.querySelector("#edit-minutes-input"),
    confirmDialog: document.querySelector("#confirm-dialog"),
    confirmTitle: document.querySelector("#confirm-title"),
    confirmCopy: document.querySelector("#confirm-copy"),
    confirmAction: document.querySelector("#confirm-action"),
    toast: document.querySelector("#toast")
  });
}

function bindEvents() {
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => setScreen(tab.dataset.screen));
  });

  els.floatingAdd.addEventListener("click", openHabitDialog);
  els.quickAdd.addEventListener("click", openHabitDialog);
  els.form.addEventListener("submit", handleHabitSubmit);
  els.prevWeek.addEventListener("click", () => moveTrackerWeek(-1));
  els.nextWeek.addEventListener("click", () => moveTrackerWeek(1));
  els.currentWeek.addEventListener("click", () => setTrackerWeek(currentWeekStartKey()));
  els.diaryMood.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mood]");
    if (!button) return;
    setDiaryMood(visibleWeekStartKey(), button.dataset.mood);
  });
  els.diaryNote.addEventListener("input", () => {
    const weekStart = visibleWeekStartKey();
    const note = els.diaryNote.value;
    clearTimeout(diaryTimer);
    diaryTimer = setTimeout(() => saveDiaryNote(weekStart, note), 350);
  });
  els.diaryNote.addEventListener("change", () => saveDiaryNote(visibleWeekStartKey(), els.diaryNote.value));
  els.habitIconPicker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-icon-choice]");
    if (!button) return;
    trackerState.draftIcon = normalizeHabitIcon(button.dataset.iconChoice);
    renderHabitPersonalizationPicker();
  });
  els.habitColorPicker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-color-choice]");
    if (!button) return;
    trackerState.draftColor = normalizeHabitColor(button.dataset.colorChoice);
    renderHabitPersonalizationPicker();
  });

  document.querySelectorAll('input[name="habit-type"]').forEach((input) => {
    input.addEventListener("change", updateTargetField);
  });

  els.prevMonth.addEventListener("click", () => {
    calendarState.month = new Date(calendarState.month.getFullYear(), calendarState.month.getMonth() - 1, 1);
    renderCalendar();
  });

  els.nextMonth.addEventListener("click", () => {
    calendarState.month = new Date(calendarState.month.getFullYear(), calendarState.month.getMonth() + 1, 1);
    renderCalendar();
  });

  els.exportJson.addEventListener("click", exportJson);
  els.exportCsv.addEventListener("click", exportCsv);
  els.importJson.addEventListener("change", handleJsonImport);
  els.importCsv.addEventListener("change", handleCsvImport);
  els.clearData.addEventListener("click", clearAllData);
  els.weekStartSetting.querySelectorAll("[data-week-start]").forEach((button) => {
    button.addEventListener("click", () => setWeekStart(Number(button.dataset.weekStart)));
  });
  els.themeSetting.querySelectorAll("[data-theme-mode]").forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.themeMode));
  });
  els.editEntryForm.addEventListener("submit", handleEditEntrySubmit);
  els.confirmDialog.addEventListener("close", () => {
    if (!pendingConfirmation) return;
    pendingConfirmation(els.confirmDialog.returnValue === "confirm");
    pendingConfirmation = null;
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    els.installButton.hidden = false;
  });

  els.installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    els.installButton.hidden = true;
  });
  window.addEventListener("online", renderConnectionStatus);
  window.addEventListener("offline", renderConnectionStatus);
  window.addEventListener("appinstalled", () => toast("Habits installed for offline use."));
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultState();
    return normalizeState(JSON.parse(saved));
  } catch {
    return defaultState();
  }
}

function defaultState() {
  return {
    habits: [],
    entries: [],
    diary: [],
    settings: {
      weekStartsOn: 1,
      theme: "dark",
      lastBackupAt: null
    }
  };
}

function normalizeState(input) {
  if (!input || typeof input !== "object") throw new Error("Backup must be an object.");
  const settings = {
    weekStartsOn: [0, 1].includes(input.settings?.weekStartsOn) ? input.settings.weekStartsOn : 1,
    theme: THEME_MODES.includes(input.settings?.theme) ? input.settings.theme : "dark",
    lastBackupAt: isIsoDateTime(input.settings?.lastBackupAt) ? input.settings.lastBackupAt : null
  };
  const idMap = new Map();
  const usedIds = new Set();
  const habits = Array.isArray(input.habits)
    ? input.habits
        .filter((habit) => habit && typeof habit.name === "string" && TYPE_LABELS[habit.type])
        .map((habit) => {
          const rawId = String(habit.id || "");
          let id = isSafeId(rawId) ? rawId : createId();
          while (usedIds.has(id)) id = createId();
          usedIds.add(id);
          if (rawId) idMap.set(rawId, id);
          return {
            id,
            name: habit.name.trim(),
            type: habit.type,
            target: normalizeTarget(habit.type, habit.target),
            createdAt: isDateKey(habit.createdAt) ? habit.createdAt : todayKey(),
            archived: Boolean(habit.archived),
            color: normalizeHabitColor(habit.color),
            icon: normalizeHabitIcon(habit.icon)
          };
        })
    : [];
  const habitIds = new Set(habits.map((habit) => habit.id));
  const entries = Array.isArray(input.entries)
    ? input.entries
        .map((entry) => entry && { ...entry, habitId: idMap.get(String(entry.habitId)) || String(entry.habitId) })
        .filter((entry) => entry && habitIds.has(entry.habitId) && isDateKey(entry.date))
        .map((entry) => ({
          habitId: entry.habitId,
          date: entry.date,
          checked: Boolean(entry.checked),
          minutes: Math.max(0, Number(entry.minutes) || 0)
        }))
    : [];
  const diary = normalizeDiary(input.diary);
  return { habits, entries, diary, settings };
}

function normalizeTarget(type, target) {
  if (type === "minutes") return Math.max(1, Number(target) || 150);
  if (type === "daily") return Math.min(7, Math.max(1, Number(target) || 7));
  return null;
}

function validateStateBackup(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Backup must be an object.");
  if (!Array.isArray(input.habits)) throw new Error("Backup must include a habits array.");
  if (!Array.isArray(input.entries)) throw new Error("Backup must include an entries array.");
  if (input.settings !== undefined && (!input.settings || typeof input.settings !== "object" || Array.isArray(input.settings))) {
    throw new Error("Backup settings must be an object.");
  }
  if (input.settings?.weekStartsOn !== undefined && ![0, 1].includes(input.settings.weekStartsOn)) {
    throw new Error("Backup week start must be Sunday or Monday.");
  }
  if (input.settings?.theme !== undefined && !THEME_MODES.includes(input.settings.theme)) {
    throw new Error("Backup theme must be dark, light, or system.");
  }
  if (input.settings?.lastBackupAt !== undefined && input.settings.lastBackupAt !== null && !isIsoDateTime(input.settings.lastBackupAt)) {
    throw new Error("Backup last backup date is invalid.");
  }
  if (input.diary !== undefined && !Array.isArray(input.diary)) throw new Error("Backup diary must be an array.");

  const ids = new Set();
  input.habits.forEach((habit, index) => {
    const row = index + 1;
    if (!habit || typeof habit !== "object" || Array.isArray(habit)) throw new Error(`Habit ${row} must be an object.`);
    if (typeof habit.id !== "string" || !habit.id.trim()) throw new Error(`Habit ${row} needs an id.`);
    if (!isSafeId(habit.id)) throw new Error(`Habit ${row} has an unsafe id.`);
    if (ids.has(habit.id)) throw new Error(`Habit ${row} has a duplicate id.`);
    ids.add(habit.id);
    if (typeof habit.name !== "string" || !habit.name.trim()) throw new Error(`Habit ${row} needs a name.`);
    if (!TYPE_LABELS[habit.type]) throw new Error(`Habit ${row} has an unknown type.`);
    if (!isDateKey(habit.createdAt)) throw new Error(`Habit ${row} has an invalid createdAt date.`);
    if (typeof habit.archived !== "boolean") throw new Error(`Habit ${row} archived must be true or false.`);
    if (habit.color !== undefined && !HABIT_COLORS[habit.color]) throw new Error(`Habit ${row} has an unknown color.`);
    if (habit.icon !== undefined && !HABIT_ICONS[habit.icon]) throw new Error(`Habit ${row} has an unknown icon.`);
    validateTargetForType(habit.type, habit.target, `Habit ${row}`);
  });

  input.entries.forEach((entry, index) => {
    const row = index + 1;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error(`Entry ${row} must be an object.`);
    if (typeof entry.habitId !== "string" || !ids.has(entry.habitId)) throw new Error(`Entry ${row} references an unknown habit.`);
    if (!isDateKey(entry.date)) throw new Error(`Entry ${row} has an invalid date.`);
    if (typeof entry.checked !== "boolean") throw new Error(`Entry ${row} checked must be true or false.`);
    if (!Number.isFinite(Number(entry.minutes)) || Number(entry.minutes) < 0) throw new Error(`Entry ${row} has invalid minutes.`);
  });
  (input.diary || []).forEach((item, index) => {
    const row = index + 1;
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`Diary ${row} must be an object.`);
    if (!isDateKey(item.weekStart)) throw new Error(`Diary ${row} has an invalid week.`);
    if (item.mood !== null && item.mood !== undefined && !MOODS.includes(item.mood)) throw new Error(`Diary ${row} has an unknown mood.`);
    if (typeof item.note !== "string") throw new Error(`Diary ${row} note must be text.`);
    if (item.updatedAt !== undefined && item.updatedAt !== null && !isIsoDateTime(item.updatedAt)) throw new Error(`Diary ${row} update date is invalid.`);
  });

  return normalizeState(input);
}

function validateTargetForType(type, target, label) {
  if (type === "weekly") {
    if (target !== null && target !== undefined && target !== "") throw new Error(`${label} target must be empty for weekly habits.`);
    return;
  }
  const value = Number(target);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${label} has an invalid target.`);
  if (type === "daily" && value > 7) throw new Error(`${label} daily target must be 1 through 7.`);
}

function persist(options = {}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error(error);
    if (!options.silent && els.toast) toast("Could not save locally. Export a JSON backup, then free browser storage.");
    return false;
  }
}

function render() {
  applyTheme();
  ensureTrackerWeek();
  const today = new Date();
  els.currentDate.textContent = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
  ensureSelectedHabit();
  renderWeekSummary();
  renderFileWarning();
  renderConnectionStatus();
  renderWeekStrip();
  renderDiary();
  renderHabits();
  renderHabitPicker();
  renderSettings();
  renderWeekdayLabels();
  renderCalendar();
}

function setScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === screenId);
  });
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.screen === screenId);
  });
}

function activeHabits() {
  return state.habits.filter((habit) => !habit.archived);
}

function ensureSelectedHabit() {
  const habits = activeHabits();
  if (!habits.length) {
    calendarState.selectedHabitId = null;
    return;
  }
  if (calendarState.selectedHabitId && !habits.some((habit) => habit.id === calendarState.selectedHabitId)) {
    calendarState.selectedHabitId = null;
  }
}

function renderWeekSummary() {
  const habits = activeHabits();
  const weekStart = visibleWeekStartKey();
  const hitCount = habits.filter((habit) => isHabitHitThisWeek(habit, weekStart)).length;
  const progressTotal = habits.reduce((sum, habit) => sum + habitProgressThisWeek(habit, weekStart), 0);
  const percent = habits.length ? Math.round((progressTotal / habits.length) * 100) : 0;
  els.weekPercent.textContent = `${percent}%`;
  els.weekOrbit.style.setProperty("--progress", `${percent}%`);
  els.weekOrbit.style.setProperty("--progress-gradient", weekProgressGradient(habits, weekStart));
  els.weekOrbit.setAttribute("aria-label", `${percent} percent complete, including partial habit progress`);
  els.weekTitle.textContent = habits.length ? `${formatProgressScore(progressTotal)}/${habits.length}` : "0/0";
  els.weekCopy.textContent = habits.length
    ? percent === 100
      ? "Complete"
      : formatWeekRange(weekStart)
    : "Add a habit";
}

function renderWeekStrip() {
  const today = todayKey();
  const days = visibleWeekDays();
  els.trackerWeekLabel.textContent = formatWeekRange(visibleWeekStartKey());
  els.nextWeek.disabled = visibleWeekStartKey() >= currentWeekStartKey();
  els.currentWeek.hidden = visibleWeekStartKey() === currentWeekStartKey();
  els.weekStrip.innerHTML = days
    .map((day) => {
      const date = parseDateKey(day);
      return `
        <div class="day-pill ${day === today ? "today" : ""}">
          <strong>${date.toLocaleDateString(undefined, { weekday: "short" })}</strong>
          <span>${date.getDate()}</span>
        </div>
      `;
    })
    .join("");
}

function renderDiary() {
  const weekStart = visibleWeekStartKey();
  const diary = getDiary(weekStart);
  els.diaryWeekLabel.textContent = formatWeekRange(weekStart);
  els.diaryMood.querySelectorAll("[data-mood]").forEach((button) => {
    const active = diary?.mood === button.dataset.mood;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (document.activeElement !== els.diaryNote) {
    els.diaryNote.value = diary?.note || "";
  }
}

function renderSettings() {
  els.weekStartSetting.querySelectorAll("[data-week-start]").forEach((button) => {
    const active = Number(button.dataset.weekStart) === state.settings.weekStartsOn;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  els.themeSetting.querySelectorAll("[data-theme-mode]").forEach((button) => {
    const active = button.dataset.themeMode === state.settings.theme;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  els.backupStatus.textContent = backupStatusCopy();
}

function renderFileWarning() {
  els.fileWarning.hidden = window.location.protocol !== "file:";
}

function renderConnectionStatus() {
  els.offlineBanner.hidden = navigator.onLine !== false;
}

function renderWeekdayLabels() {
  const labels = rangeDays(currentWeekStartKey(), 7)
    .map((day) => parseDateKey(day).toLocaleDateString(undefined, { weekday: "short" }));
  els.calendarWeekdays.innerHTML = labels.map((label) => `<span>${label}</span>`).join("");
}

function renderHabits() {
  const habits = activeHabits();
  if (!habits.length) {
    els.habitList.innerHTML = `
      <article class="empty-state">
        <h3>Your tracker is ready</h3>
        <p>Add daily habits, weekly checkoffs, or cumulative minute goals.</p>
        <button class="primary-button" type="button" data-action="add-empty">Add your first habit</button>
      </article>
    `;
    els.habitList.querySelector("[data-action='add-empty']").addEventListener("click", openHabitDialog);
    return;
  }

  els.habitList.innerHTML = habits.map(renderHabitCard).join("");
  els.habitList.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () => toggleHabit(button.dataset.toggle));
  });
  els.habitList.querySelectorAll("[data-toggle-date]").forEach((button) => {
    button.addEventListener("click", () => toggleHabitDate(button.dataset.toggleDate, button.dataset.date));
  });
  els.habitList.querySelectorAll("[data-edit-habit]").forEach((target) => {
    target.addEventListener("click", () => {
      if (target.matches("button")) openEditHabitDialog(target.dataset.editHabit);
    });
    target.addEventListener("dblclick", () => openEditHabitDialog(target.dataset.editHabit));
  });
  els.habitList.querySelectorAll("[data-archive]").forEach((button) => {
    button.addEventListener("click", () => archiveHabit(button.dataset.archive));
  });
  els.habitList.querySelectorAll("[data-add-minutes]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = els.habitList.querySelector(`[data-minute-input="${button.dataset.addMinutes}"]`);
      addMinutes(button.dataset.addMinutes, Number(input.value));
      input.value = "";
    });
  });
  els.habitList.querySelectorAll("[data-set-minutes]").forEach((input) => {
    input.addEventListener("change", () => {
      setMinutes(input.dataset.setMinutes, input.dataset.date, Number(input.value));
    });
    input.addEventListener("focus", () => input.select());
  });
  els.habitList.querySelectorAll("[data-minute-input]").forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const habitId = input.dataset.minuteInput;
      addMinutes(habitId, Number(input.value));
      input.value = "";
    });
  });
}

function renderHabitCard(habit) {
  if (habit.type === "minutes") return renderMinutesHabit(habit);
  const id = escapeAttribute(habit.id);
  const weekStart = visibleWeekStartKey();
  const weekCount = habit.type === "daily" ? weeklyCheckedCount(habit.id, weekStart) : 0;
  const progressLabel = habit.type === "daily" ? `${weekCount}/${dailyTarget(habit)}` : isChecked(habit.id, weekStart) ? "Done" : "Open";
  return `
    <article class="habit-card" style="${habitStyle(habit)}">
      <div class="habit-top">
        <div class="habit-title" data-edit-habit="${id}" title="Double-click to edit">
          ${renderHabitIcon(habit)}
          <div class="habit-copy">
            <h3>${escapeHtml(habit.name)}</h3>
          </div>
        </div>
        <span class="habit-pill" aria-label="${escapeAttribute(progressLabel)}">${progressLabel}</span>
        <div class="habit-actions">
          <button class="icon-button config-button" type="button" data-edit-habit="${id}" aria-label="Edit ${escapeAttribute(habit.name)}">${settingsIcon()}</button>
          <button class="icon-button archive-button" type="button" data-archive="${id}" aria-label="Archive ${escapeAttribute(habit.name)}">${closeIcon()}</button>
        </div>
      </div>
      ${habit.type === "daily" ? renderDailyTargetMeter(habit) + renderDailyWeekButtons(habit) : renderWeeklyCheckButton(habit)}
    </article>
  `;
}

function renderMinutesHabit(habit) {
  const id = escapeAttribute(habit.id);
  const weekStart = visibleWeekStartKey();
  const viewingCurrentWeek = weekStart === currentWeekStartKey();
  const total = weekMinuteTotal(habit.id, weekStart);
  const percent = Math.min(100, Math.round((total / habit.target) * 100));
  return `
    <article class="habit-card" style="${habitStyle(habit)}">
      <div class="habit-top">
        <div class="habit-title" data-edit-habit="${id}" title="Double-click to edit">
          ${renderHabitIcon(habit)}
          <div class="habit-copy">
            <h3>${escapeHtml(habit.name)}</h3>
          </div>
        </div>
        <span class="habit-pill" aria-label="${total} of ${habit.target} minutes">${total}/${habit.target}</span>
        <div class="habit-actions">
          <button class="icon-button config-button" type="button" data-edit-habit="${id}" aria-label="Edit ${escapeAttribute(habit.name)}">${settingsIcon()}</button>
          <button class="icon-button archive-button" type="button" data-archive="${id}" aria-label="Archive ${escapeAttribute(habit.name)}">${closeIcon()}</button>
        </div>
      </div>
      ${renderMeter(percent, `${percent}% complete`)}
      ${renderMinuteWeekInputs(habit)}
      ${viewingCurrentWeek ? `<div class="minute-controls">
        <input data-minute-input="${id}" type="number" min="1" step="1" inputmode="numeric" placeholder="min" aria-label="Minutes today">
        <button class="minute-add" type="button" data-add-minutes="${id}" aria-label="Add minutes">+</button>
      </div>` : ""}
    </article>
  `;
}

function renderMinuteWeekInputs(habit) {
  const id = escapeAttribute(habit.id);
  return `
    <div class="minute-week-grid" aria-label="Minutes by day in selected week">
      ${visibleWeekDays()
        .map((day) => {
          const label = parseDateKey(day).toLocaleDateString(undefined, { weekday: "narrow" });
          const minutes = getEntry(habit.id, day)?.minutes || 0;
          return `
            <label>
              <span>${label}</span>
              <input data-set-minutes="${id}" data-date="${day}" type="number" min="0" step="1" inputmode="numeric" value="${minutes || ""}" placeholder="0" aria-label="${label} minutes">
            </label>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderDailyTargetMeter(habit) {
  const count = weeklyCheckedCount(habit.id, visibleWeekStartKey());
  const target = dailyTarget(habit);
  const percent = Math.min(100, Math.round((count / target) * 100));
  return renderMeter(percent, `${count} of ${target} this week`);
}

function renderDailyWeekButtons(habit) {
  const id = escapeAttribute(habit.id);
  return `
    <div class="check-week-grid" aria-label="Check off days in selected week">
      ${visibleWeekDays()
        .map((day) => {
          const label = parseDateKey(day).toLocaleDateString(undefined, { weekday: "narrow" });
          const checked = isChecked(habit.id, day);
          return `
            <button class="${checked ? "done" : ""}" type="button" data-toggle-date="${id}" data-date="${day}" aria-pressed="${checked}" aria-label="${label} ${checked ? "complete" : "open"}">
              <span>${label}</span>
              <strong>${checked ? checkIcon() : ""}</strong>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderWeeklyCheckButton(habit) {
  const id = escapeAttribute(habit.id);
  const checked = isChecked(habit.id, visibleWeekStartKey());
  return `
    <button class="weekly-touch ${checked ? "done" : ""}" type="button" data-toggle-date="${id}" data-date="${visibleWeekStartKey()}" aria-pressed="${checked}" aria-label="${checked ? "Completed" : "Open"} this week">
      <span>${checked ? checkIcon() : ""}</span>
    </button>
  `;
}

function renderMeter(percent, label) {
  return `<div class="meter" role="img" aria-label="${escapeAttribute(label)}"><div class="meter-track" aria-hidden="true"><div class="meter-fill" style="--fill: ${percent}%"></div></div></div>`;
}

function renderHabitPicker() {
  const habits = activeHabits();
  if (!habits.length) {
    els.habitPicker.innerHTML = "";
    els.streakPanel.innerHTML = `
      <div class="streak-stat"><span>Current</span><strong>0</strong></div>
      <div class="streak-stat"><span>Best</span><strong>0</strong></div>
    `;
    return;
  }
  els.habitPicker.innerHTML = [
    `<button class="picker-chip overview-chip ${!calendarState.selectedHabitId ? "active" : ""}" type="button" data-pick="">All habits</button>`,
    ...habits
    .map(
      (habit) =>
        `<button class="picker-chip ${habit.id === calendarState.selectedHabitId ? "active" : ""}" type="button" data-pick="${escapeAttribute(habit.id)}" style="${habitStyle(habit)}">${renderHabitIcon(habit)}<span>${escapeHtml(habit.name)}</span></button>`
    )
  ]
    .join("");
  els.habitPicker.querySelectorAll("[data-pick]").forEach((button) => {
    button.addEventListener("click", () => {
      calendarState.selectedHabitId = button.dataset.pick || null;
      renderHabitPicker();
      renderCalendar();
    });
  });
}

function renderCalendar() {
  const habits = activeHabits();
  const habit = habits.find((item) => item.id === calendarState.selectedHabitId);
  const viewingOverview = !calendarState.selectedHabitId;
  const title = calendarState.month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  els.calendarTitle.textContent = title;

  if (!habits.length) {
    els.calendarGrid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><h3>No habit selected</h3><p>Add a habit to see streaks.</p></div>`;
    return;
  }

  const days = monthGridDays(calendarState.month);
  const month = calendarState.month.getMonth();
  const today = todayKey();
  if (viewingOverview) {
    const overview = calendarOverviewStats(days, month);
    els.calendarGrid.style.removeProperty("--habit-color");
    els.streakPanel.innerHTML = `
      <div class="streak-stat"><span>Marked days</span><strong>${overview.markedDays}</strong></div>
      <div class="streak-stat"><span>Total marks</span><strong>${overview.marks}</strong></div>
    `;
  } else {
    const stats = getStreakStats(habit);
    els.calendarGrid.style.setProperty("--habit-color", habitColorValue(habit));
    els.streakPanel.innerHTML = `
      <div class="streak-stat"><span>Current ${formatStreakUnit(2, stats.unit)}</span><strong>${stats.current}</strong></div>
      <div class="streak-stat"><span>Best ${formatStreakUnit(2, stats.unit)}</span><strong>${stats.best}</strong></div>
    `;
  }

  els.calendarGrid.innerHTML = days
    .map((day) => {
      const key = toDateKey(day);
      const status = viewingOverview ? overviewCalendarStatus(key) : calendarStatus(habit, key);
      const note = viewingOverview ? overviewCalendarNote(key) : calendarNote(habit, key);
      const markers = viewingOverview ? renderOverviewMarkers(key) : "";
      const weeklyOffday = !viewingOverview && habit.type === "weekly" && key !== startOfWeekKey(key);
      const disabled = key > today || weeklyOffday;
      return `
        <button class="calendar-day ${day.getMonth() === month ? "current-month" : ""} ${key === today ? "today" : ""} ${weeklyOffday ? "week-offday" : ""} ${status}" type="button" data-calendar-date="${key}" ${disabled ? "disabled" : ""} aria-label="${viewingOverview ? overviewCalendarLabel(key) : calendarDayLabel(habit, key)}">
          <span>${day.getDate()}</span>
          ${note ? `<span class="calendar-note">${note}</span>` : ""}
          ${markers}
        </button>
      `;
    })
    .join("");
  if (!viewingOverview) {
    els.calendarGrid.querySelectorAll("[data-calendar-date]").forEach((button) => {
      button.addEventListener("click", () => editCalendarDate(habit, button.dataset.calendarDate));
    });
  }
}

function editCalendarDate(habit, date) {
  if (date > todayKey()) return;
  if (habit.type === "minutes") {
    openMinuteEditSheet(habit, date);
    return;
  }
  if (habit.type === "weekly") {
    toggleHabitDate(habit.id, startOfWeekKey(date));
    return;
  }
  toggleHabitDate(habit.id, date);
}

function openMinuteEditSheet(habit, date) {
  pendingEdit = { habitId: habit.id, date };
  const existing = getEntry(habit.id, date)?.minutes || 0;
  els.editEntryTitle.textContent = habit.name;
  els.editEntryCopy.textContent = `${formatShortDate(date)} minutes`;
  els.editMinutesInput.value = existing ? String(existing) : "";
  els.editEntryDialog.showModal();
  requestAnimationFrame(() => els.editMinutesInput.focus());
}

function handleEditEntrySubmit(event) {
  event.preventDefault();
  if (event.submitter?.value === "cancel") {
    els.editEntryDialog.close();
    pendingEdit = null;
    return;
  }
  if (!pendingEdit) return;
  setMinutes(pendingEdit.habitId, pendingEdit.date, Number(els.editMinutesInput.value || 0));
  pendingEdit = null;
  els.editEntryDialog.close();
}

function openHabitDialog() {
  trackerState.editingHabitId = null;
  trackerState.draftColor = DEFAULT_HABIT_COLOR;
  trackerState.draftIcon = DEFAULT_HABIT_ICON;
  els.form.reset();
  els.habitDialogKicker.textContent = "New habit";
  els.habitDialogTitle.textContent = "Add a habit";
  setHabitTypeInputsLocked(false);
  document.querySelector('input[name="habit-type"][value="daily"]').checked = true;
  updateTargetField({ resetValue: true });
  renderHabitPersonalizationPicker();
  document.querySelector("#save-habit").textContent = "Save habit";
  els.dialog.showModal();
  requestAnimationFrame(() => els.habitName.focus());
}

function openEditHabitDialog(habitId) {
  const habit = state.habits.find((item) => item.id === habitId);
  if (!habit) return;
  trackerState.editingHabitId = habitId;
  trackerState.draftColor = normalizeHabitColor(habit.color);
  trackerState.draftIcon = normalizeHabitIcon(habit.icon);
  els.form.reset();
  els.habitDialogKicker.textContent = "Edit habit";
  els.habitDialogTitle.textContent = "Habit settings";
  els.habitName.value = habit.name;
  setHabitTypeInputsLocked(hasHabitEntries(habit.id));
  const radio = document.querySelector(`input[name="habit-type"][value="${habit.type}"]`);
  if (radio) radio.checked = true;
  updateTargetField({ resetValue: false });
  if (habit.type === "daily" || habit.type === "minutes") els.habitTarget.value = String(habit.target);
  renderHabitPersonalizationPicker();
  document.querySelector("#save-habit").textContent = "Update habit";
  els.dialog.showModal();
  requestAnimationFrame(() => els.habitName.focus());
}

function updateTargetField(options = {}) {
  const resetValue = options.resetValue !== false;
  const type = document.querySelector('input[name="habit-type"]:checked')?.value || "daily";
  if (type === "weekly") {
    els.targetField.hidden = true;
    return;
  }
  els.targetField.hidden = false;
  if (type === "minutes") {
    els.targetLabel.textContent = "Weekly minute goal";
    els.habitTarget.min = "1";
    els.habitTarget.max = "";
    if (resetValue) els.habitTarget.value = els.habitTarget.value && Number(els.habitTarget.value) > 7 ? els.habitTarget.value : "150";
  } else {
    els.targetLabel.textContent = "Times per week";
    els.habitTarget.min = "1";
    els.habitTarget.max = "7";
    if (resetValue) els.habitTarget.value = "7";
  }
}

function setHabitTypeInputsLocked(locked) {
  document.querySelectorAll('input[name="habit-type"]').forEach((input) => {
    input.disabled = locked;
  });
  els.typeLockNote.hidden = !locked;
}

function renderHabitPersonalizationPicker() {
  els.habitIconPicker.innerHTML = Object.entries(HABIT_ICONS)
    .map(([key, icon]) => `
      <button class="${trackerState.draftIcon === key ? "active" : ""}" type="button" data-icon-choice="${key}" aria-label="${escapeAttribute(icon.label)}" aria-pressed="${trackerState.draftIcon === key}">
        ${icon.glyph ? `<span class="habit-glyph">${icon.glyph}</span>` : icon.svg}
      </button>
    `)
    .join("");
  els.habitColorPicker.innerHTML = Object.entries(HABIT_COLORS)
    .map(([key, color]) => `
      <button class="${trackerState.draftColor === key ? "active" : ""}" type="button" data-color-choice="${key}" aria-label="${escapeAttribute(color.label)}" aria-pressed="${trackerState.draftColor === key}" style="--choice-color: ${color.value}"></button>
    `)
    .join("");
}

function handleHabitSubmit(event) {
  event.preventDefault();
  const submitter = event.submitter;
  if (submitter?.value === "cancel") {
    trackerState.editingHabitId = null;
    setHabitTypeInputsLocked(false);
    els.dialog.close();
    return;
  }
  const name = els.habitName.value.trim();
  if (!name) return;
  const editingHabit = trackerState.editingHabitId
    ? state.habits.find((habit) => habit.id === trackerState.editingHabitId)
    : null;
  const typeInput = document.querySelector('input[name="habit-type"]:checked');
  const requestedType = typeInput?.value || "daily";
  const type = editingHabit && hasHabitEntries(editingHabit.id) ? editingHabit.type : requestedType;
  const target = normalizeTarget(type, els.habitTarget.value);
  if (editingHabit) {
    editingHabit.name = name;
    editingHabit.type = type;
    editingHabit.target = target;
    editingHabit.color = normalizeHabitColor(trackerState.draftColor);
    editingHabit.icon = normalizeHabitIcon(trackerState.draftIcon);
  } else {
    state.habits.push({
      id: createId(),
      name,
      type,
      target,
      createdAt: todayKey(),
      archived: false,
      color: normalizeHabitColor(trackerState.draftColor),
      icon: normalizeHabitIcon(trackerState.draftIcon)
    });
  }
  persist();
  els.dialog.close();
  toast(editingHabit ? "Habit updated." : "Habit added.");
  trackerState.editingHabitId = null;
  setHabitTypeInputsLocked(false);
  render();
}

function toggleHabit(habitId) {
  const habit = state.habits.find((item) => item.id === habitId);
  if (!habit) return;
  const date = habit.type === "weekly" ? visibleWeekStartKey() : todayKey();
  toggleHabitDate(habitId, date);
}

function toggleHabitDate(habitId, date) {
  if (!isDateKey(date)) return;
  const entry = ensureEntry(habitId, date);
  entry.checked = !entry.checked;
  persist();
  render();
}

function setWeekStart(weekStartsOn) {
  if (![0, 1].includes(weekStartsOn)) return;
  const previousWeekStart = state.settings.weekStartsOn;
  if (weekStartsOn === previousWeekStart) return;
  migrateWeekAnchoredData(weekStartsOn);
  state.settings.weekStartsOn = weekStartsOn;
  trackerState.visibleWeekStart = currentWeekStartKey();
  persist();
  toast(`Weeks now start on ${weekStartsOn === 0 ? "Sunday" : "Monday"}.`);
  render();
}

function setTheme(theme) {
  if (!THEME_MODES.includes(theme)) return;
  state.settings.theme = theme;
  persist();
  toast(`Appearance set to ${theme}.`);
  render();
}

function migrateWeekAnchoredData(toWeekStart) {
  const weeklyHabitIds = new Set(state.habits.filter((habit) => habit.type === "weekly").map((habit) => habit.id));
  const entryMap = new Map();
  state.entries.forEach((entry) => {
    const date = weeklyHabitIds.has(entry.habitId)
      ? toDateKey(startOfWeek(parseDateKey(entry.date), toWeekStart))
      : entry.date;
    const key = `${entry.habitId}|${date}`;
    const current = entryMap.get(key);
    if (current) {
      current.checked = current.checked || entry.checked;
      current.minutes = Math.max(current.minutes || 0, entry.minutes || 0);
    } else {
      entryMap.set(key, { ...entry, date });
    }
  });
  state.entries = Array.from(entryMap.values());

  const diaryMap = new Map();
  state.diary.forEach((item) => {
    const weekStart = toDateKey(startOfWeek(parseDateKey(item.weekStart), toWeekStart));
    const current = diaryMap.get(weekStart);
    if (!current || (item.updatedAt || "") > (current.updatedAt || "")) {
      diaryMap.set(weekStart, { ...item, weekStart });
    }
  });
  state.diary = Array.from(diaryMap.values());
}

function applyTheme() {
  const theme = THEME_MODES.includes(state.settings.theme) ? state.settings.theme : "dark";
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.dataset.theme = theme;
  }
}

async function archiveHabit(habitId) {
  const habit = state.habits.find((item) => item.id === habitId);
  if (!habit) return;
  const confirmed = await askConfirmation({
    title: `Archive "${habit.name}"?`,
    copy: "The habit will leave your tracker, but its history stays in exports.",
    actionLabel: "Archive"
  });
  if (!confirmed) return;
  habit.archived = true;
  persist();
  toast("Habit archived.", {
    label: "Undo",
    onClick: () => {
      habit.archived = false;
      persist();
      render();
      toast("Habit restored.");
    }
  });
  render();
}

function addMinutes(habitId, amount) {
  if (!Number.isFinite(amount) || amount <= 0) {
    toast("Enter minutes first.");
    return;
  }
  const entry = ensureEntry(habitId, todayKey());
  entry.minutes += Math.round(amount);
  persist();
  render();
}

function setMinutes(habitId, date, amount) {
  if (!isDateKey(date) || !Number.isFinite(amount) || amount < 0) {
    toast("Enter zero or more minutes.");
    render();
    return;
  }
  const entry = ensureEntry(habitId, date);
  entry.minutes = Math.round(amount);
  persist();
  render();
}

function isHabitHitThisWeek(habit, weekStart = visibleWeekStartKey()) {
  if (habit.type === "weekly") return isChecked(habit.id, weekStart);
  if (habit.type === "minutes") return weekMinuteTotal(habit.id, weekStart) >= habit.target;
  return weeklyCheckedCount(habit.id, weekStart) >= dailyTarget(habit);
}

function habitProgressThisWeek(habit, weekStart = visibleWeekStartKey()) {
  if (habit.type === "weekly") return isChecked(habit.id, weekStart) ? 1 : 0;
  if (habit.type === "minutes") return Math.min(1, weekMinuteTotal(habit.id, weekStart) / habit.target);
  return Math.min(1, weeklyCheckedCount(habit.id, weekStart) / dailyTarget(habit));
}

function weekProgressGradient(habits, weekStart) {
  if (!habits.length) return "conic-gradient(color-mix(in srgb, var(--accent) 12%, transparent) 0 100%)";
  const blank = "color-mix(in srgb, var(--accent) 12%, transparent)";
  let cursor = 0;
  const segments = [];
  habits.forEach((habit) => {
    const end = cursor + (habitProgressThisWeek(habit, weekStart) / habits.length) * 100;
    if (end > cursor) segments.push(`${habitColorValue(habit)} ${cursor}% ${end}%`);
    cursor = end;
  });
  segments.push(`${blank} ${cursor}% 100%`);
  return `conic-gradient(${segments.join(", ")})`;
}

function getEntry(habitId, date) {
  return state.entries.find((entry) => entry.habitId === habitId && entry.date === date);
}

function ensureEntry(habitId, date) {
  let entry = getEntry(habitId, date);
  if (!entry) {
    entry = { habitId, date, checked: false, minutes: 0 };
    state.entries.push(entry);
  }
  return entry;
}

function isChecked(habitId, date) {
  return Boolean(getEntry(habitId, date)?.checked);
}

function weekMinuteTotal(habitId, weekStart = currentWeekStartKey()) {
  const days = rangeDays(weekStart, 7);
  return days.reduce((sum, day) => sum + (getEntry(habitId, day)?.minutes || 0), 0);
}

function weeklyCheckedCount(habitId, weekStart = currentWeekStartKey()) {
  return rangeDays(weekStart, 7).filter((day) => isChecked(habitId, day)).length;
}

function hasHabitEntries(habitId) {
  return state.entries.some((entry) => entry.habitId === habitId && (entry.checked || entry.minutes > 0));
}

function getDiary(weekStart) {
  return state.diary.find((item) => item.weekStart === weekStart);
}

function ensureDiary(weekStart) {
  let diary = getDiary(weekStart);
  if (!diary) {
    diary = { weekStart, mood: null, note: "", updatedAt: new Date().toISOString() };
    state.diary.push(diary);
  }
  return diary;
}

function setDiaryMood(weekStart, mood) {
  if (!MOODS.includes(mood)) return;
  const diary = ensureDiary(weekStart);
  diary.mood = mood;
  diary.updatedAt = new Date().toISOString();
  persist();
  renderDiary();
}

function saveDiaryNote(weekStart, note) {
  if (!isDateKey(weekStart)) return;
  const trimmedNote = String(note).slice(0, 360);
  const existing = getDiary(weekStart);
  if (!existing && !trimmedNote.trim()) return;
  const diary = ensureDiary(weekStart);
  if (diary.note === trimmedNote) return;
  diary.note = trimmedNote;
  diary.updatedAt = new Date().toISOString();
  persist();
}

function dailyTarget(habit) {
  return Math.min(7, Math.max(1, Number(habit.target) || 7));
}

function getStreakStats(habit) {
  return {
    current: currentStreak(habit),
    best: bestStreak(habit),
    unit: habit.type === "daily" && dailyTarget(habit) === 7 ? "day" : "week"
  };
}

function currentStreak(habit) {
  if (habit.type === "daily" && dailyTarget(habit) === 7) {
    let cursor = parseDateKey(todayKey());
    if (!dayComplete(habit, toDateKey(cursor))) cursor = addDays(cursor, -1);
    let count = 0;
    while (toDateKey(cursor) >= habit.createdAt && dayComplete(habit, toDateKey(cursor))) {
      count += 1;
      cursor = addDays(cursor, -1);
    }
    return count;
  }

  let cursor = startOfWeek(new Date(), state.settings.weekStartsOn);
  if (!weekComplete(habit, toDateKey(cursor))) cursor = addDays(cursor, -7);
  let count = 0;
  while (toDateKey(cursor) >= startOfWeekKey(habit.createdAt) && weekComplete(habit, toDateKey(cursor))) {
    count += 1;
    cursor = addDays(cursor, -7);
  }
  return count;
}

function bestStreak(habit) {
  let best = 0;
  let current = 0;
  if (habit.type === "daily" && dailyTarget(habit) === 7) {
    for (let cursor = parseDateKey(habit.createdAt); toDateKey(cursor) <= todayKey(); cursor = addDays(cursor, 1)) {
      if (dayComplete(habit, toDateKey(cursor))) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    return best;
  }

  const firstWeek = parseDateKey(startOfWeekKey(habit.createdAt));
  const thisWeek = startOfWeek(new Date(), state.settings.weekStartsOn);
  for (let cursor = firstWeek; cursor <= thisWeek; cursor = addDays(cursor, 7)) {
    if (weekComplete(habit, toDateKey(cursor))) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

function dayComplete(habit, date) {
  if (habit.type === "daily") return isChecked(habit.id, date);
  if (habit.type === "minutes") return (getEntry(habit.id, date)?.minutes || 0) > 0;
  return false;
}

function weekComplete(habit, weekStart) {
  if (habit.type === "daily") return weeklyCheckedCount(habit.id, weekStart) >= dailyTarget(habit);
  if (habit.type === "weekly") return isChecked(habit.id, weekStart);
  if (habit.type === "minutes") return weekMinuteTotal(habit.id, weekStart) >= habit.target;
  return false;
}

function calendarStatus(habit, date) {
  if (date > todayKey()) return "";
  if (date < habit.createdAt) return "";
  if (habit.type === "daily") {
    if (isChecked(habit.id, date)) return "done";
    if (dailyTarget(habit) === 7) return "missed";
    if (date !== startOfWeekKey(date)) return "";
    if (weekComplete(habit, date)) return "done";
    return addDays(parseDateKey(date), 6) < parseDateKey(todayKey()) ? "missed" : "";
  }
  if (habit.type === "minutes") return (getEntry(habit.id, date)?.minutes || 0) > 0 ? "partial" : "";
  const weekStart = startOfWeekKey(date);
  return date === weekStart && isChecked(habit.id, weekStart) ? "done" : "";
}

function calendarNote(habit, date) {
  if (habit.type === "minutes") return getEntry(habit.id, date)?.minutes || "";
  if (habit.type === "daily" && dailyTarget(habit) < 7 && date === startOfWeekKey(date) && date <= todayKey()) {
    return `${weeklyCheckedCount(habit.id, date)}/${dailyTarget(habit)}`;
  }
  return "";
}

function calendarOverviewStats(days, month) {
  const monthDays = days.map(toDateKey).filter((date) => parseDateKey(date).getMonth() === month && date <= todayKey());
  return monthDays.reduce((stats, date) => {
    const markers = calendarMarkersForDate(date);
    if (markers.length) stats.markedDays += 1;
    stats.marks += markers.length;
    return stats;
  }, { markedDays: 0, marks: 0 });
}

function overviewCalendarStatus(date) {
  const markers = calendarMarkersForDate(date);
  return markers.length ? "overview-marked" : "";
}

function overviewCalendarNote(date) {
  const markers = calendarMarkersForDate(date);
  return markers.length > 1 ? markers.length : "";
}

function renderOverviewMarkers(date) {
  const markers = calendarMarkersForDate(date);
  if (!markers.length) return "";
  const tracks = markers.slice(0, 4).map((habit, index) => {
    const previous = toDateKey(addDays(parseDateKey(date), -1));
    const next = toDateKey(addDays(parseDateKey(date), 1));
    const fromPrevious = startOfWeekKey(previous) === startOfWeekKey(date) && hasCalendarMarker(habit, previous);
    const toNext = startOfWeekKey(next) === startOfWeekKey(date) && hasCalendarMarker(habit, next);
    return `
      <span class="calendar-marker-track marked ${fromPrevious ? "from-prev" : ""} ${toNext ? "to-next" : ""}" style="${habitStyle(habit)}; --track-index: ${index}">
        <i></i>
      </span>
    `;
  }).join("");
  return `<span class="calendar-markers" aria-hidden="true">${tracks}</span>`;
}

function calendarMarkersForDate(date) {
  if (date > todayKey()) return [];
  return activeHabits().filter((habit) => hasCalendarMarker(habit, date));
}

function hasCalendarMarker(habit, date) {
  if (date < habit.createdAt) return false;
  if (habit.type === "daily") return isChecked(habit.id, date);
  if (habit.type === "minutes") return (getEntry(habit.id, date)?.minutes || 0) > 0;
  return date === startOfWeekKey(date) && isChecked(habit.id, date);
}

function overviewCalendarLabel(date) {
  const dateLabel = formatShortDate(date);
  const markers = calendarMarkersForDate(date);
  if (!markers.length) return escapeAttribute(`${dateLabel}, no habit marks`);
  const names = markers.slice(0, 3).map((habit) => habit.name).join(", ");
  const suffix = markers.length > 3 ? ` and ${markers.length - 3} more` : "";
  return escapeAttribute(`${dateLabel}, ${markers.length} habit ${markers.length === 1 ? "mark" : "marks"}: ${names}${suffix}`);
}

function calendarDayLabel(habit, date) {
  const dateLabel = formatShortDate(date);
  if (habit.type === "minutes") {
    const minutes = getEntry(habit.id, date)?.minutes || 0;
    return escapeAttribute(`${habit.name}, ${dateLabel}, ${minutes} minutes`);
  }
  if (habit.type === "daily") {
    const status = isChecked(habit.id, date) ? "checked" : "not checked";
    return escapeAttribute(`${habit.name}, ${dateLabel}, ${status}`);
  }
  const checked = isChecked(habit.id, startOfWeekKey(date)) ? "checked" : "not checked";
  return escapeAttribute(`${habit.name}, week of ${formatShortDate(startOfWeekKey(date))}, ${checked}`);
}

function exportJson() {
  state.settings.lastBackupAt = new Date().toISOString();
  persist({ silent: true });
  downloadFile(`habits-backup-${todayKey()}.json`, "application/json", JSON.stringify(state, null, 2));
  toast("JSON backup exported.");
  renderSettings();
}

function exportCsv() {
  const rows = [["habit_name", "habit_type", "date", "checked", "minutes", "target"]];
  state.habits.forEach((habit) => {
    const entries = state.entries.filter((entry) => entry.habitId === habit.id);
    if (!entries.length) {
      rows.push([habit.name, habit.type, "", "false", "0", habit.target || ""]);
    } else {
      entries.forEach((entry) => {
        rows.push([habit.name, habit.type, entry.date, String(entry.checked), String(entry.minutes || 0), habit.target || ""]);
      });
    }
  });
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadFile(`habits-log-${todayKey()}.csv`, "text/csv", csv);
  toast("CSV log exported.");
}

async function handleJsonImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const raw = JSON.parse(text);
    const imported = validateStateBackup(raw);
    const confirmed = await askConfirmation({
      title: "Restore JSON backup?",
      copy: `This will replace local data with ${imported.habits.length} habits, ${imported.entries.length} entries, and ${imported.diary.length} diary notes.`,
      actionLabel: "Restore"
    });
    if (!confirmed) return;
    state.habits = imported.habits;
    state.entries = imported.entries;
    state.diary = imported.diary;
    state.settings = imported.settings;
    if (!persist()) return;
    toast("JSON backup restored.");
    render();
  } catch (error) {
    toast(`Import failed: ${error.message}`);
  } finally {
    event.target.value = "";
  }
}

async function handleCsvImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const imported = parseHabitCsv(text);
    const preview = previewCsvMerge(imported);
    const confirmed = await askConfirmation({
      title: "Import CSV log?",
      copy: `This will add ${preview.newHabits} habits and update ${preview.entries} dated entries. Existing matching dates may be overwritten.`,
      actionLabel: "Import"
    });
    if (!confirmed) return;
    mergeImportedCsv(imported);
    if (!persist()) return;
    toast("CSV log imported.");
    render();
  } catch (error) {
    toast(`Import failed: ${error.message}`);
  } finally {
    event.target.value = "";
  }
}

function parseHabitCsv(text) {
  const rows = parseCsv(text);
  const header = rows.shift()?.map((cell) => cell.trim());
  const expected = ["habit_name", "habit_type", "date", "checked", "minutes", "target"];
  if (!header || header.length !== expected.length || expected.some((field, index) => header[index] !== field)) {
    throw new Error("CSV header is not recognized.");
  }
  return rows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row, index) => {
      if (row.length !== expected.length) throw new Error(`Row ${index + 2} has the wrong number of columns.`);
      const [name, type, date, checked, minutes, target] = row;
      if (!name?.trim()) throw new Error(`Row ${index + 2} needs a habit name.`);
      if (!TYPE_LABELS[type]) throw new Error(`Row ${index + 2} has an unknown habit type.`);
      if (date && !isDateKey(date)) throw new Error(`Row ${index + 2} has an invalid date.`);
      if (!["true", "false"].includes(checked)) throw new Error(`Row ${index + 2} checked must be true or false.`);
      const minuteValue = Number(minutes);
      if (!Number.isFinite(minuteValue) || minuteValue < 0) throw new Error(`Row ${index + 2} has invalid minutes.`);
      validateTargetForType(type, target, `Row ${index + 2}`);
      if (!date && (checked === "true" || minuteValue > 0)) throw new Error(`Row ${index + 2} needs a date for logged progress.`);
      return {
        name: name.trim(),
        type,
        date,
        checked: checked === "true",
        minutes: Math.round(minuteValue),
        target: normalizeTarget(type, target)
      };
    });
}

function previewCsvMerge(rows) {
  const existing = new Set(state.habits.map((habit) => `${habit.name.toLowerCase()}|${habit.type}`));
  const incoming = new Set(rows.map((row) => `${row.name.toLowerCase()}|${row.type}`));
  return {
    newHabits: Array.from(incoming).filter((key) => !existing.has(key)).length,
    entries: rows.filter((row) => row.date).length
  };
}

function mergeImportedCsv(rows) {
  const habitByKey = new Map(state.habits.map((habit) => [`${habit.name.toLowerCase()}|${habit.type}`, habit]));
  const grouped = new Map();
  rows.forEach((row) => {
    const key = `${row.name.toLowerCase()}|${row.type}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  });

  grouped.forEach((groupRows, key) => {
    const first = groupRows[0];
    let habit = habitByKey.get(key);
    const datedRows = groupRows.filter((row) => row.date);
    const earliestDate = datedRows.length
      ? datedRows.map((row) => row.date).sort()[0]
      : todayKey();
    if (!habit) {
      habit = {
        id: createId(),
        name: first.name,
        type: first.type,
        target: first.target,
        createdAt: earliestDate,
        archived: false,
        color: DEFAULT_HABIT_COLOR,
        icon: DEFAULT_HABIT_ICON
      };
      state.habits.push(habit);
      habitByKey.set(key, habit);
    } else {
      if (first.type === "minutes" || first.type === "daily") habit.target = first.target;
      habit.createdAt = [habit.createdAt, earliestDate].filter(Boolean).sort()[0];
      habit.archived = false;
    }
    groupRows.forEach((row) => {
      if (!row.date) return;
      const existingIndex = state.entries.findIndex((entry) => entry.habitId === habit.id && entry.date === row.date);
      const entry = { habitId: habit.id, date: row.date, checked: row.checked, minutes: row.minutes };
      if (existingIndex >= 0) state.entries[existingIndex] = entry;
      else state.entries.push(entry);
    });
  });
}

async function clearAllData() {
  const snapshot = cloneState(state);
  const confirmed = await askConfirmation({
    title: "Clear all local data?",
    copy: "This removes every habit and entry from this browser.",
    actionLabel: "Clear"
  });
  if (!confirmed) return;
  state.habits = [];
  state.entries = [];
  state.diary = [];
  state.settings = defaultState().settings;
  persist();
  toast("Local data cleared.", {
    label: "Undo",
    onClick: () => {
      restoreState(snapshot);
      persist();
      render();
      toast("Local data restored.");
    }
  });
  render();
}

function downloadFile(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function askConfirmation({ title, copy, actionLabel }) {
  if (pendingConfirmation) pendingConfirmation(false);
  els.confirmTitle.textContent = title;
  els.confirmCopy.textContent = copy;
  els.confirmAction.textContent = actionLabel;
  els.confirmDialog.returnValue = "";
  els.confirmDialog.showModal();
  return new Promise((resolve) => {
    pendingConfirmation = resolve;
  });
}

function cloneState(source) {
  return JSON.parse(JSON.stringify(source));
}

function restoreState(snapshot) {
  state.habits = snapshot.habits || [];
  state.entries = snapshot.entries || [];
  state.diary = snapshot.diary || [];
  state.settings = snapshot.settings || defaultState().settings;
}

function toast(message, action) {
  clearTimeout(toastTimer);
  els.toast.textContent = "";
  els.toast.classList.toggle("has-action", Boolean(action));
  const text = document.createElement("span");
  text.textContent = message;
  els.toast.append(text);
  if (action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.addEventListener("click", () => {
      clearTimeout(toastTimer);
      els.toast.classList.remove("show", "has-action");
      action.onClick();
    });
    els.toast.append(button);
  }
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show", "has-action"), 2800);
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `habit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function currentWeekStartKey() {
  return toDateKey(startOfWeek(new Date(), state.settings.weekStartsOn));
}

function ensureTrackerWeek() {
  if (!trackerState.visibleWeekStart || !isDateKey(trackerState.visibleWeekStart)) {
    trackerState.visibleWeekStart = currentWeekStartKey();
  }
}

function visibleWeekStartKey() {
  ensureTrackerWeek();
  return trackerState.visibleWeekStart;
}

function visibleWeekDays() {
  return rangeDays(visibleWeekStartKey(), 7);
}

function moveTrackerWeek(offsetWeeks) {
  setTrackerWeek(toDateKey(addDays(parseDateKey(visibleWeekStartKey()), offsetWeeks * 7)));
}

function setTrackerWeek(weekStart) {
  const normalized = startOfWeekKey(weekStart);
  trackerState.visibleWeekStart = normalized > currentWeekStartKey() ? currentWeekStartKey() : normalized;
  render();
}

function startOfWeekKey(dateKey) {
  return toDateKey(startOfWeek(parseDateKey(dateKey), state.settings.weekStartsOn));
}

function startOfWeek(date, weekStartsOn) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function rangeDays(startKey, count) {
  const start = parseDateKey(startKey);
  return Array.from({ length: count }, (_, index) => toDateKey(addDays(start, index)));
}

function monthGridDays(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = startOfWeek(first, state.settings.weekStartsOn);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function addDays(date, days) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

function todayKey() {
  return toDateKey(new Date());
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(key) {
  return parseDateKey(key).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatWeekRange(weekStart) {
  const start = parseDateKey(weekStart);
  const end = addDays(start, 6);
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return weekStart === currentWeekStartKey() ? `This week · ${startLabel}-${endLabel}` : `${startLabel}-${endLabel}`;
}

function formatProgressScore(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function backupStatusCopy() {
  if (!state.settings.lastBackupAt) return "Last JSON backup: never";
  const date = new Date(state.settings.lastBackupAt);
  const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const ageDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  return ageDays > 14 ? `Last JSON backup: ${label}. A fresh backup is a good idea.` : `Last JSON backup: ${label}`;
}

function formatStreakUnit(count, unit) {
  return count === 1 ? unit : `${unit}s`;
}

function isDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && toDateKey(parseDateKey(value)) === value;
}

function isIsoDateTime(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isSafeId(value) {
  return typeof value === "string" && SAFE_ID_PATTERN.test(value);
}

function normalizeHabitColor(color) {
  return HABIT_COLORS[color] ? color : DEFAULT_HABIT_COLOR;
}

function normalizeHabitIcon(icon) {
  return HABIT_ICONS[icon] ? icon : DEFAULT_HABIT_ICON;
}

function normalizeDiary(diary) {
  if (!Array.isArray(diary)) return [];
  const byWeek = new Map();
  diary
    .filter((item) => item && isDateKey(item.weekStart))
    .forEach((item) => {
      const normalized = {
        weekStart: item.weekStart,
        mood: MOODS.includes(item.mood) ? item.mood : null,
        note: typeof item.note === "string" ? item.note.slice(0, 360) : "",
        updatedAt: isIsoDateTime(item.updatedAt) ? item.updatedAt : new Date().toISOString()
      };
      const current = byWeek.get(normalized.weekStart);
      if (!current || normalized.updatedAt > current.updatedAt) byWeek.set(normalized.weekStart, normalized);
    });
  return Array.from(byWeek.values());
}

function habitColorValue(habit) {
  return HABIT_COLORS[normalizeHabitColor(habit.color)].value;
}

function habitStyle(habit) {
  return `--habit-color: ${habitColorValue(habit)}`;
}

function renderHabitIcon(habit) {
  const icon = HABIT_ICONS[normalizeHabitIcon(habit.icon)];
  const content = icon.glyph ? `<span class="habit-glyph">${icon.glyph}</span>` : icon.svg;
  return `<span class="habit-icon" aria-hidden="true">${content}</span>`;
}

function settingsIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"/><path d="M19 12a7.4 7.4 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a7.2 7.2 0 0 0-1.9-1.1L14.3 3h-4.6l-.3 2.9A7.2 7.2 0 0 0 7.5 7l-2.4-1-2 3.4 2 1.5A7.4 7.4 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.4 2.4-1c.6.5 1.2.8 1.9 1.1l.3 2.9h4.6l.3-2.9c.7-.3 1.3-.6 1.9-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1.1Z"/></svg>';
}

function closeIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
}

function checkIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 6.8"/></svg>';
}

function csvEscape(value) {
  const string = String(value ?? "");
  if (/[",\n]/.test(string)) return `"${string.replaceAll('"', '""')}"`;
  return string;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field.");
  row.push(cell);
  rows.push(row);
  return rows;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") return;
  navigator.serviceWorker.register("./sw.js").then((registration) => {
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          toast("Offline app updated.");
        }
      });
    });
  }).catch(() => {
    toast("Offline caching is unavailable in this preview.");
  });
}
