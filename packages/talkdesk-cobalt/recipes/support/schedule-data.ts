/** Screenshot sample rows/metrics; no customer records or live WFM service data. */
export const AGENT_NAMES = [
  'agent config',
  'agent config 2',
  'Alex Chen',
  'Alexandre Almeida1',
  'Anderson Sergio',
  'André Reis',
  'Andre Simoes',
  'António Ferreira',
  'Bruno Silva Supervisor',
  'Carmen Cortes',
  'Cátia Almeida',
  'Cloud Jiang',
  'Cobalt Design Team',
  'Christopher Pereira',
];
export const AGENTS = Array.from({ length: 75 }, (_, i) => ({
  id: `agent-${i + 1}`,
  name: AGENT_NAMES[i] ?? `Sample agent ${i + 1}`,
  badge: i === 6 ? 1 : i === 9 ? 22 : i === 13 ? 5 : 0,
}));
export const METRICS = [
  'Predicted service level',
  'Predicted AWT',
  'Required staffing',
  'Predicted staffing',
  'Staffing difference',
  'Scheduled headcount',
];
export const REQUIRED = [
  216.34, 215.99, 216, 215.95, 216.27, 215.63, 216.21, 215.59, 260.79, 347.66, 340.36, 348.99,
  347.36, 345.72, 342.23, 340.53, 340.53, 342.16, 216, 215.38, 215.59, 215.35, 215.33, 215.33,
];
export const PREDICTED = [
  0.75, 1, 1.5, 2, 1.75, 2, 3, 2.5, 3, 1.58, 1.75, 1.75, 1.5, 0.5, 0, 2, 0, 1, 1, 0.5, 1, 1.25, 2,
  2,
];
export const AWT = [
  320, 320, 320, 320, 320, 320, 320, 320, 252, 227, 232, 224, 226, 229, 228, 230, 229, 228, 318,
  320, 320, 320, 320, 320,
];
export interface ScheduleEvent {
  id: string;
  agent: string;
  start: number;
  end: number;
  title: string;
  kind: 'work' | 'break' | 'unavailable';
  striped?: boolean;
}
export const SAMPLE_EVENTS: ScheduleEvent[] = [
  { id: 'alex-work', agent: 'agent-3', start: 20, end: 24, title: 'Working shift', kind: 'work' },
  {
    id: 'alex-away',
    agent: 'agent-3',
    start: 20,
    end: 21.5,
    title: 'Unavailable',
    kind: 'unavailable',
    striped: true,
  },
  {
    id: 'reis-lock',
    agent: 'agent-6',
    start: 0,
    end: 24,
    title: 'Locked interval',
    kind: 'unavailable',
    striped: true,
  },
  { id: 'reis-work', agent: 'agent-6', start: 17, end: 24, title: 'Working shift', kind: 'work' },
  { id: 'reis-break', agent: 'agent-6', start: 21, end: 21.25, title: 'Break', kind: 'break' },
  {
    id: 'simoes-work',
    agent: 'agent-7',
    start: 0.25,
    end: 9.25,
    title: 'Working shift',
    kind: 'work',
  },
  { id: 'simoes-break', agent: 'agent-7', start: 4.25, end: 4.5, title: 'Break', kind: 'break' },
  {
    id: 'simoes-away',
    agent: 'agent-7',
    start: 9,
    end: 9.15,
    title: 'Unavailable',
    kind: 'unavailable',
  },
  {
    id: 'simoes-evening',
    agent: 'agent-7',
    start: 17,
    end: 24,
    title: 'Working shift',
    kind: 'work',
  },
  {
    id: 'simoes-evening-break',
    agent: 'agent-7',
    start: 21,
    end: 21.25,
    title: 'Break',
    kind: 'break',
  },
  {
    id: 'carmen-work',
    agent: 'agent-10',
    start: 6,
    end: 13.5,
    title: 'Working shift',
    kind: 'work',
  },
  {
    id: 'carmen-break1',
    agent: 'agent-10',
    start: 7.75,
    end: 8,
    title: 'Break',
    kind: 'break',
    striped: true,
  },
  {
    id: 'carmen-away',
    agent: 'agent-10',
    start: 9,
    end: 9.5,
    title: 'Unavailable',
    kind: 'unavailable',
    striped: true,
  },
  {
    id: 'carmen-break2',
    agent: 'agent-10',
    start: 11,
    end: 11.25,
    title: 'Break',
    kind: 'break',
    striped: true,
  },
];
