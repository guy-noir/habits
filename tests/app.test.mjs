import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function loadApp() {
  const code = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
  const context = {
    console,
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {}
    },
    document: {
      addEventListener() {},
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      documentElement: {
        dataset: {},
        removeAttribute() {}
      }
    },
    window: {
      addEventListener() {},
      location: { protocol: "http:" }
    },
    navigator: {},
    crypto: {
      randomUUID() {
        return `test-${Math.random().toString(36).slice(2)}`;
      }
    },
    setTimeout,
    clearTimeout
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context;
}

const app = loadApp();

assert.throws(
  () => app.validateStateBackup({
    habits: [{
      id: 'bad" onclick="x',
      name: "Read",
      type: "daily",
      target: 4,
      createdAt: "2026-05-04",
      archived: false
    }],
    entries: []
  }),
  /unsafe id/
);

const normalized = app.normalizeState({
  habits: [{
    id: 'bad" id',
    name: "Read",
    type: "daily",
    target: 4,
    createdAt: "2026-05-04",
    archived: false
  }],
  entries: [{ habitId: 'bad" id', date: "2026-05-04", checked: true, minutes: 0 }]
});
assert.notEqual(normalized.habits[0].id, 'bad" id');
assert.equal(normalized.entries[0].habitId, normalized.habits[0].id);
assert.equal(normalized.habits[0].color, "cyan");
assert.equal(normalized.habits[0].icon, "star");

assert.throws(
  () => app.parseHabitCsv('habit_name,habit_type,date,checked,minutes,target\n"Read,daily,2026-05-04,true,0,4'),
  /unclosed quoted field/
);

const migrated = vm.runInContext(`
  state.habits = [{
    id: "weekly-1",
    name: "Plan",
    type: "weekly",
    target: null,
    createdAt: "2026-05-04",
    archived: false,
    color: "cyan",
    icon: "star"
  }];
  state.entries = [{ habitId: "weekly-1", date: "2026-05-04", checked: true, minutes: 0 }];
  state.diary = [{ weekStart: "2026-05-04", mood: "good", note: "solid", updatedAt: "2026-05-05T00:00:00.000Z" }];
  migrateWeekAnchoredData(0);
  JSON.stringify({ entries: state.entries, diary: state.diary });
`, app);
const migratedState = JSON.parse(migrated);
assert.equal(migratedState.entries[0].date, "2026-05-03");
assert.equal(migratedState.diary[0].weekStart, "2026-05-03");

const partialProgress = vm.runInContext(`
  state.settings.weekStartsOn = 1;
  state.habits = [{
    id: "daily-1",
    name: "Lift",
    type: "daily",
    target: 4,
    createdAt: "2026-05-04",
    archived: false,
    color: "cyan",
    icon: "star"
  }];
  state.entries = [
    { habitId: "daily-1", date: "2026-05-04", checked: true, minutes: 0 },
    { habitId: "daily-1", date: "2026-05-05", checked: true, minutes: 0 }
  ];
  habitProgressThisWeek(state.habits[0], "2026-05-04");
`, app);
assert.equal(partialProgress, 0.5);

assert.throws(
  () => app.validateStateBackup({
    habits: [{
      id: "bad-icon",
      name: "Run",
      type: "daily",
      target: 4,
      createdAt: "2026-05-04",
      archived: false,
      icon: "rocket"
    }],
    entries: []
  }),
  /unknown icon/
);

const glyphs = vm.runInContext(`
  [
    renderHabitIcon({ icon: "pulse", color: "cyan" }),
    renderHabitIcon({ icon: "shoe", color: "cyan" })
  ].join("\\n");
`, app);
assert.match(glyphs, /\u{1F4AA}/u);
assert.match(glyphs, /\u{1F3C3}\u200D\u2642\uFE0F/u);

const csvMerge = vm.runInContext(`
  state.habits = [];
  state.entries = [];
  const rows = parseHabitCsv([
    "habit_name,habit_type,date,checked,minutes,target",
    "Cardio,minutes,2026-05-10,false,20,150",
    "Cardio,minutes,2026-05-01,false,15,150"
  ].join("\\n"));
  mergeImportedCsv(rows);
  JSON.stringify({ habit: state.habits[0], entries: state.entries });
`, app);
const csvState = JSON.parse(csvMerge);
assert.equal(csvState.habit.createdAt, "2026-05-01");
assert.equal(csvState.entries.length, 2);

const calendarForWeeklyTarget = vm.runInContext(`
  state.settings.weekStartsOn = 1;
  state.habits = [{
    id: "daily-4",
    name: "Lift",
    type: "daily",
    target: 4,
    createdAt: "2026-05-04",
    archived: false,
    color: "cyan",
    icon: "star"
  }];
  state.entries = [
    { habitId: "daily-4", date: "2026-05-04", checked: true, minutes: 0 },
    { habitId: "daily-4", date: "2026-05-05", checked: true, minutes: 0 },
    { habitId: "daily-4", date: "2026-05-06", checked: true, minutes: 0 },
    { habitId: "daily-4", date: "2026-05-07", checked: true, minutes: 0 }
  ];
  JSON.stringify({
    weekStart: calendarStatus(state.habits[0], "2026-05-04"),
    uncheckedMidweek: calendarStatus(state.habits[0], "2026-05-08"),
    note: calendarNote(state.habits[0], "2026-05-04")
  });
`, app);
const calendarState = JSON.parse(calendarForWeeklyTarget);
assert.equal(calendarState.weekStart, "done");
assert.equal(calendarState.uncheckedMidweek, "");
assert.equal(calendarState.note, "4/4");

const colorGradient = vm.runInContext(`
  state.settings.weekStartsOn = 1;
  state.habits = [
    {
      id: "daily-half",
      name: "Lift",
      type: "daily",
      target: 4,
      createdAt: "2026-05-04",
      archived: false,
      color: "cyan",
      icon: "star"
    },
    {
      id: "minutes-half",
      name: "Cardio",
      type: "minutes",
      target: 100,
      createdAt: "2026-05-04",
      archived: false,
      color: "rose",
      icon: "shoe"
    }
  ];
  state.entries = [
    { habitId: "daily-half", date: "2026-05-04", checked: true, minutes: 0 },
    { habitId: "daily-half", date: "2026-05-05", checked: true, minutes: 0 },
    { habitId: "minutes-half", date: "2026-05-04", checked: false, minutes: 50 }
  ];
  weekProgressGradient(state.habits, "2026-05-04");
`, app);
assert.match(colorGradient, /#22d3ee 0% 25%/);
assert.match(colorGradient, /#fb7185 25% 50%/);

const overviewMarkers = vm.runInContext(`
  state.settings.weekStartsOn = 1;
  state.habits = [
    {
      id: "read",
      name: "Read",
      type: "daily",
      target: 7,
      createdAt: "2026-05-04",
      archived: false,
      color: "cyan",
      icon: "book"
    },
    {
      id: "cardio",
      name: "Cardio",
      type: "minutes",
      target: 150,
      createdAt: "2026-05-04",
      archived: false,
      color: "rose",
      icon: "shoe"
    }
  ];
  state.entries = [
    { habitId: "read", date: "2026-05-04", checked: true, minutes: 0 },
    { habitId: "read", date: "2026-05-05", checked: true, minutes: 0 },
    { habitId: "read", date: "2026-05-06", checked: true, minutes: 0 },
    { habitId: "cardio", date: "2026-05-05", checked: false, minutes: 30 }
  ];
  renderOverviewMarkers("2026-05-05");
`, app);
assert.match(overviewMarkers, /calendar-marker-track marked from-prev to-next/);
assert.match(overviewMarkers, /--track-index: 0/);
assert.match(overviewMarkers, /--track-index: 1/);
assert.match(overviewMarkers, /#22d3ee/);
assert.match(overviewMarkers, /#fb7185/);

app.localStorage.setItem = () => {
  throw new Error("quota");
};
const originalConsoleError = app.console.error;
app.console.error = () => {};
assert.equal(vm.runInContext("persist({ silent: true })", app), false);
app.console.error = originalConsoleError;

console.log("app logic tests passed");
