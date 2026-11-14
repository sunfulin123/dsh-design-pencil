/** Fictional user records and their schema for the reusable ListPage recipe. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Supervisor' | 'Agent';
  queues: string[];
  team: string | null;
  integration: string;
  active: boolean;
}

// Fictional names and @example.com addresses only.
const NAMES = [
  'Avery Example',
  'Blake Sample',
  'Casey Placeholder',
  'Drew Demo',
  'Emery Testcase',
  'Finley Example',
];
const QUEUES = ['General', 'Billing', 'Support', 'Sales', 'Priority'];
export const SAMPLE_USERS: User[] = Array.from({ length: 49 }, (_, i) => {
  const name = `${NAMES[i % NAMES.length]} ${i + 1}`;
  return {
    id: `user-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    role: i % 7 === 0 ? 'Administrator' : i % 3 === 0 ? 'Supervisor' : 'Agent',
    queues: QUEUES.slice(i % QUEUES.length, (i % QUEUES.length) + (i % 4) + 1),
    team: i % 5 === 0 ? null : `Team ${['Alpha', 'Beta', 'Gamma', 'Delta'][i % 4]}`,
    integration: i % 4 === 0 ? 'Sample CRM' : 'Default',
    active: i % 6 !== 0,
  };
});
