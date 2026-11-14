import React from 'react';
import ThemeProvider from '@talkdesk/cobalt-react-theme-provider';
import { render, screen } from '@testing-library/react';
import { createRequire } from 'node:module';
import { SidePanel, type SidePanelProps } from '../SidePanel';

// Cobalt's nested CommonJS components must share this provider's context.
const { default: ViewportProvider } = createRequire(import.meta.url)(
  '@talkdesk/cobalt-react-viewport-provider'
) as typeof import('@talkdesk/cobalt-react-viewport-provider');

const renderPanel = (props: Partial<SidePanelProps> = {}) =>
  render(
    <ThemeProvider>
      <ViewportProvider>
        <SidePanel
          visible
          closeLabel="Close schedule editor"
          onClose={vi.fn()}
          {...props}
        />
      </ViewportProvider>
    </ThemeProvider>
  );

describe('SidePanel', () => {
  beforeAll(() => {
    vi.stubGlobal(
      'FontFace',
      class {
        load = vi.fn().mockResolvedValue(undefined);
      }
    );

    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { has: vi.fn().mockReturnValue(false), add: vi.fn() },
    });
  });

  afterAll(() => vi.unstubAllGlobals());

  it('labels the panel close button with the supplied localized name', async () => {
    renderPanel();

    expect(
      await screen.findByRole('button', { name: 'Close schedule editor' })
    ).toBeInTheDocument();
  });

  it.each(['default', 'form', 'participants'] as const)(
    'preserves the title direction for the %s layout',
    async (variant) => {
      renderPanel({
        variant,
        title: 'Schedule',
        subtitle: 'Choose participants',
      });

      const heading = await screen.findByRole('heading', { name: 'Schedule' });
      const direction = variant === 'participants' ? 'column' : 'row';

      expect(heading.parentElement?.className).toContain(
        `co-flex--${direction}`
      );

      if (variant === 'participants') {
        expect(heading).toHaveStyle({
          fontSize: '24px',
          fontWeight: '400',
          lineHeight: '24px',
          margin: '0px',
        });

        expect(heading.parentElement).toHaveStyle({ gap: '4px' });
        expect(screen.getByText('Choose participants').parentElement).toBe(
          heading.parentElement
        );
      } else {
        expect(
          screen.queryByText('Choose participants')
        ).not.toBeInTheDocument();
      }
    }
  );
});
