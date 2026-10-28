export default {
  title: 'Performance analytics',
  subtitle: 'Your playing style on six axes, computed from your matches and journal.',
  dominant: 'Your strongest axis',
  empty: 'Not enough data yet. Log matches and sessions to see your profile.',
  chart: 'Playing style hexagon chart',
  breakdown: 'Breakdown by axis',
  noData: 'No data',
  axes: {
    pressure: {
      name: 'Pressure / Passing',
      basis: 'Points per match from passes, knee on belly and mount (match log).',
    },
    wrestling: {
      name: 'Wrestling / Pace',
      basis: 'Points per match from takedowns and sparring rounds per session as a cardio measure.',
    },
    submission: {
      name: 'Submissions',
      basis: 'Submissions achieved per sparring round (journal).',
    },
    defense: {
      name: 'Control / Defense',
      basis: 'Few submissions suffered per round and few points conceded per match.',
    },
    consistency: {
      name: 'Consistency',
      basis: 'Training sessions per week over the last 8 weeks (journal). 4 per week is full marks.',
    },
    transitions: {
      name: 'Inversions / Transitions',
      basis: 'Points per match from sweeps and back takes (match log).',
    },
    flexibility: {
      name: 'Flexibility / Guard',
      basis: 'Self-rated: no logged data measures it.',
    },
  },
  rating: {
    label: 'Your flexibility and guard rating',
    help: 'From 1 to 10. It is the only axis you score yourself.',
    unset: 'Not rated',
  },
} as const;
