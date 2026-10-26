export default {
  title: 'Home',
  belt: 'Your belt',
  editProfile: 'Edit profile',
  hours: 'Hours on the mat',
  hoursValue: '{{value}} h',
  sessions: '{{count}} sessions',
  last: {
    title: 'Last session',
    empty: 'You have not logged any session yet.',
    summary: '{{date}} · {{mode}} · {{minutes}} min',
    details: '{{rounds}} rounds · {{achieved}} submissions landed · {{suffered}} suffered',
  },
  actions: {
    title: 'Quick actions',
    journal: 'Log session',
    sparring: 'Sparring',
    plan: 'Create plan',
    library: 'Library',
  },
} as const;
