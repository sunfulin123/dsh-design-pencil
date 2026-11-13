import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assistantMarkdownEchoesScreenshot,
  checkPocQuestionReadiness,
  deviationDecisionFromQuestionAnswer,
  deviationQuestionsFromCallArgs,
  parsePlannedScreens,
  pocDeliverableFiles,
  pocFromQuestionAnswer,
  routeFromQuestionAnswer,
  validateFunnelContextInput,
} from './design-discovery-gate.mjs';

test('planned screens and funnel context inputs validate states, unread sources, and summary bounds', () => {
  assert.deepEqual(parsePlannedScreens([{ name: 'Inbox', states: ['empty', 'loading'] }]), [
    { name: 'Inbox', states: ['empty', 'loading'] },
  ]);
  assert.throws(() => parsePlannedScreens([]), /one to thirty-two/);
  assert.throws(() => parsePlannedScreens([{ name: 'Inbox' }, { name: 'inbox' }]), /Duplicate/);
  assert.throws(() => parsePlannedScreens([{ name: 'Inbox', states: ['bogus'] }]), /Unsupported content state/);

  assert.throws(
    () =>
      validateFunnelContextInput(
        {
          contextSummary: 'Short',
          sourceReferences: [],
          openQuestions: [],
          screens: [{ name: 'Inbox' }],
        },
        new Set(),
      ),
    /concise summary/,
  );

  assert.throws(
    () =>
      validateFunnelContextInput(
        {
          contextSummary: 'Detailed enough summary for context validation in tests.',
          sourceReferences: ['file:src/unread.ts'],
          openQuestions: [],
          screens: [{ name: 'Inbox' }],
        },
        new Set(['src/read.ts']),
      ),
    /not successfully read/,
  );

  const ready = validateFunnelContextInput(
    {
      contextSummary: 'Support agents triage live customer conversations and resolve tickets.',
      sourceReferences: ['conversation', 'file:src/read.ts'],
      openQuestions: [],
      screens: [{ name: 'Inbox', states: ['empty'] }],
      platform: 'web',
      canvasWidth: 1440,
    },
    new Set(['src/read.ts']),
  );
  assert.equal(ready.status, 'ready');
  assert.deepEqual(ready.canvasHints, { platform: 'web', canvasWidth: 1440 });
});

test('route, POC, and deviation questions resolve strictly by positional option index', () => {
  const routeOpts = [{ label: 'HTML POC first' }, { label: 'Direct Synapse' }];
  assert.equal(
    routeFromQuestionAnswer({ answers: [{ id: 'synapse-design-route:t1', selected: ['Direct Synapse'] }] }, 't1', routeOpts),
    'synapse',
  );
  const pocOpts = [{ label: 'Continue' }, { label: 'Revise POC' }];
  assert.equal(
    pocFromQuestionAnswer({ answers: [{ id: 'synapse-design-poc:t1', selected: ['Revise POC'] }] }, 't1', pocOpts),
    'hold',
  );

  const callArgs = JSON.stringify({
    questions: [
      {
        id: 'synapse-design-deviation:d1:chat',
        options: [{ label: 'Approve omitting shell' }, { label: 'Keep full shell' }],
      },
    ],
  });
  const [devQ] = deviationQuestionsFromCallArgs(callArgs);
  assert.equal(devQ.id, 'synapse-design-deviation:d1:chat');
  assert.equal(
    deviationDecisionFromQuestionAnswer(
      { answers: [{ id: 'synapse-design-deviation:d1:chat', selected: ['Approve omitting shell'] }] },
      devQ.id,
      devQ.options,
    ),
    'approved',
  );
  assert.equal(
    deviationDecisionFromQuestionAnswer(
      { answers: [{ id: 'synapse-design-deviation:d1:chat', selected: ['Keep full shell'] }] },
      devQ.id,
      devQ.options,
    ),
    'rejected',
  );
});

test('POC deliverable extraction puts HTML entry first and ask_user_question requires record + inline screenshot echo', () => {
  const taskId = '3d0a49b0060cc81f7e3f2f978c082b9b';
  const entry = `/work/.synapse/html-design/tasks/${taskId}/index.html`;
  const shot = `/work/.synapse/html-design/tasks/${taskId}/shots/chat-inbox.png`;
  const pocResult = {
    status: 'poc_recorded',
    taskId,
    pocState: {
      version: 1,
      owner: 'owner-1',
      taskId,
      entry,
      screenshots: [{ path: shot, screen: 'Chat Inbox', viewport: 1440 }],
    },
  };
  const deliverables = pocDeliverableFiles(pocResult);
  assert.deepEqual(deliverables, [
    { path: entry, description: 'HTML POC Prototype' },
    { path: shot, description: 'Chat Inbox screenshot (1440px)' },
  ]);

  assert.equal(assistantMarkdownEchoesScreenshot(`Plain mention ${shot}`, [{ path: shot }]), false);
  assert.equal(assistantMarkdownEchoesScreenshot(`![Chat Inbox](${shot})`, [{ path: shot }]), true);
  assert.equal(
    assistantMarkdownEchoesScreenshot(`![Chat Inbox](.synapse/html-design/tasks/${taskId}/shots/chat-inbox.png)`, [{ path: shot }]),
    true,
  );

  const askArgs = { questions: [{ id: `synapse-design-poc:${taskId}`, options: [{ label: 'Continue' }, { label: 'Revise' }] }] };

  // 1. Asking before POC record is blocked.
  const beforeRecord = checkPocQuestionReadiness(askArgs, [], 'owner-1');
  assert.equal(beforeRecord.ok, false);
  assert.equal(beforeRecord.kind, 'missing_record');

  // 2. Asking right after record without echoing ![...](screenshot) in an assistant message is blocked.
  const eventsWithoutEcho = [{ type: 'tool/ptc-dispatch', data: { meta: pocResult } }];
  const withoutEcho = checkPocQuestionReadiness(askArgs, eventsWithoutEcho, 'owner-1');
  assert.equal(withoutEcho.ok, false);
  assert.equal(withoutEcho.kind, 'missing_screenshot_echo');
  assert.equal(withoutEcho.entry, entry);
  assert.equal(withoutEcho.primaryScreenshot, shot);

  // 3. A pre-record assistant message does not satisfy a later record.
  const staleEcho = [
    {
      type: 'assistant/message',
      data: { message: { role: 'assistant', content: [{ type: 'text', text: `![Chat Inbox](${shot})` }] } },
    },
    { type: 'tool/ptc-dispatch', data: { meta: pocResult } },
  ];
  assert.equal(checkPocQuestionReadiness(askArgs, staleEcho, 'owner-1').ok, false);

  // 4. Echoing the rendered screenshot in a post-record assistant message unlocks ask_user_question.
  const validEvents = [
    { type: 'tool/ptc-dispatch', data: { meta: pocResult } },
    {
      type: 'assistant/message',
      data: {
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: `Prototype ready: [index.html](${entry})\n\n![Chat Inbox](${shot})` }],
        },
      },
    },
  ];
  assert.deepEqual(checkPocQuestionReadiness(askArgs, validEvents, 'owner-1'), { ok: true });

  // 5. Degraded POC record with 0 screenshots requires a post-record assistant message linking the entry, not broken ![...]().
  const unverifiedPocResult = {
    status: 'poc_recorded',
    taskId,
    pocState: { version: 1, owner: 'owner-1', taskId, entry, screenshots: [] },
  };
  assert.equal(
    checkPocQuestionReadiness(askArgs, [{ type: 'tool/ptc-dispatch', data: { meta: unverifiedPocResult } }], 'owner-1').ok,
    false,
  );
  assert.deepEqual(
    checkPocQuestionReadiness(
      askArgs,
      [
        { type: 'tool/ptc-dispatch', data: { meta: unverifiedPocResult } },
        {
          type: 'assistant/message',
          data: {
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: `Prototype ready: [index.html](${entry}) (screenshots unverified)` }],
            },
          },
        },
      ],
      'owner-1',
    ),
    { ok: true },
  );
});
