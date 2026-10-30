export interface WeeklyProgress {
  /** Sessions in the week that contains today. */
  thisWeek: number;
  /** Consecutive weeks meeting the goal; the current week counts only once it meets it. */
  current: number;
  best: number;
}

/** Weeks counted from the epoch, starting on Monday (1970-01-01 was a Thursday). */
function weekIndex(date: string): number {
  return Math.floor((Date.parse(date) / 86_400_000 + 3) / 7);
}

/** Weekly attendance from session dates (yyyy-mm-dd); sessions after `today` are ignored. */
export function weeklyProgress(dates: string[], goal: number, today: string): WeeklyProgress {
  const currentWeek = weekIndex(today);
  const perWeek = new Map<number, number>();
  for (const date of dates) {
    const week = weekIndex(date);
    if (date <= today) perWeek.set(week, (perWeek.get(week) ?? 0) + 1);
  }
  const met = (week: number) => (perWeek.get(week) ?? 0) >= goal;

  let current = 0;
  for (let week = met(currentWeek) ? currentWeek : currentWeek - 1; met(week); week--) current++;

  let best = 0;
  let run = 0;
  let previous: number | undefined;
  for (const week of [...perWeek.keys()].filter(met).sort((a, b) => a - b)) {
    run = previous === week - 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = week;
  }

  return { thisWeek: perWeek.get(currentWeek) ?? 0, current, best };
}
