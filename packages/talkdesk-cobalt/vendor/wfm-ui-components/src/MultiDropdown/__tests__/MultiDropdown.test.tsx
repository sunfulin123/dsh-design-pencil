import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiDropdown } from '../MultiDropdown';

type CobaltProps = {
  'data-qa'?: string;
  customValue?: React.ReactNode;
  forwardedRef?: React.Ref<HTMLDivElement>;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onFocusCapture?: React.FocusEventHandler<HTMLDivElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
};

/**
 * Stands in for the Cobalt dropdown so the container/trigger wiring this package owns can be observed
 * directly. Cobalt renders the trigger with `role="button"` and stops its own click from bubbling; the
 * mocked tree keeps exactly that contract (trigger inside the container, trigger stops propagation).
 */
const cobalt = vi.hoisted(() => ({
  props: null as CobaltProps | null,
  delayRoot: false,
}));

vi.mock('@talkdesk/cobalt-marketplace-react-multi-dropdown', () => ({
  default: function MockCobalt(props: CobaltProps) {
    const [mounted, setMounted] = React.useState(!cobalt.delayRoot);

    React.useEffect(() => {
      if (cobalt.delayRoot) queueMicrotask(() => setMounted(true));
    }, []);

    cobalt.props = props;
    if (!mounted) return null;

    // Match Cobalt's unadapted divs rather than adding semantics the wrapper owns.
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/interactive-supports-focus */
    return (
      <div
        ref={props.forwardedRef}
        data-qa={props['data-qa']}
        onClick={props.onClick}
        onFocusCapture={props.onFocusCapture}
        onKeyDown={props.onKeyDown}
      >
        <div
          data-qa="trigger"
          role="button"
          onClick={(event) => event.stopPropagation()}
        >
          <input readOnly aria-hidden="true" />
        </div>
      </div>
    );
    /* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/interactive-supports-focus */
  },
  Option: () => null,
  Search: () => null,
}));

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

const renderDropdown = (openOnContainerClick?: boolean) =>
  render(
    <MultiDropdown
      data-qa="multi"
      openOnContainerClick={openOnContainerClick}
      options={options}
      onChange={vi.fn()}
    />
  );

const container = () =>
  document.querySelector<HTMLElement>('[data-qa="multi"]')!;

const trigger = () =>
  document.querySelector<HTMLElement>('[data-qa="trigger"]')!;

describe('MultiDropdown labelled trigger', () => {
  beforeEach(() => {
    cobalt.delayRoot = false;
  });

  it('uses the requested placeholder size only until a value is selected', () => {
    const { rerender } = render(
      <MultiDropdown
        messages={{ placeholder: 'Choose agents' }}
        options={options}
        placeholderSize="medium"
        onChange={vi.fn()}
      />
    );

    expect(cobalt.props?.customValue).toMatchObject({
      props: { children: 'Choose agents', size: 'medium' },
    });

    rerender(
      <MultiDropdown
        messages={{ placeholder: 'Choose agents' }}
        options={options}
        placeholderSize="medium"
        value={['a']}
        onChange={vi.fn()}
      />
    );

    expect(cobalt.props?.customValue).toBeUndefined();
  });

  it('adapts a root that mounts after the wrapper effect has already run', async () => {
    cobalt.delayRoot = true;
    render(
      <>
        <span id="what-if-human-selection-label">Human schedules</span>
        <MultiDropdown
          aria-labelledby="what-if-human-selection-label"
          options={options}
          onChange={vi.fn()}
        />
      </>
    );

    const button = await screen.findByRole('button', {
      name: 'Human schedules',
    });

    expect(button).toHaveAttribute('tabindex', '0');
    expect(button).toHaveAttribute('aria-disabled', 'false');
    expect(button.querySelector('input')).toHaveAttribute('tabindex', '-1');
  });

  it.each(['Enter', ' ', 'ArrowDown'])(
    'focuses the labelled trigger by Tab and opens it with %s',
    async (key) => {
      const user = userEvent.setup();

      render(
        <>
          <span id="agents-label">Agents</span>
          <MultiDropdown
            aria-labelledby="agents-label"
            options={options}
            onChange={vi.fn()}
          />
        </>
      );

      const button = screen.getByRole('button', { name: 'Agents' });
      const onTriggerClick = vi.fn();

      button.addEventListener('click', onTriggerClick);
      await user.tab();
      expect(button).toHaveFocus();
      expect(fireEvent.keyDown(button, { key })).toBe(false);
      expect(onTriggerClick).toHaveBeenCalledTimes(1);
    }
  );

  it.each(['disabled', 'loading'] as const)(
    'does not activate a %s labelled trigger from the keyboard',
    (blocked) => {
      render(
        <>
          <span id="agents-label">Agents</span>
          <MultiDropdown
            aria-labelledby="agents-label"
            options={options}
            {...{ [blocked]: true }}
            onChange={vi.fn()}
          />
        </>
      );

      const button = screen.getByRole('button', { name: 'Agents' });
      const onTriggerClick = vi.fn();

      button.addEventListener('click', onTriggerClick);
      expect(button).toHaveAttribute('tabindex', '-1');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(onTriggerClick).not.toHaveBeenCalled();
    }
  );

  it('keeps focus on the trigger when Cobalt focuses its hidden input', () => {
    render(
      <>
        <span id="agents-label">Agents</span>
        <MultiDropdown
          aria-labelledby="agents-label"
          options={options}
          onChange={vi.fn()}
        />
      </>
    );

    const button = screen.getByRole('button', { name: 'Agents' });
    const input = button.querySelector('input');

    if (!input) throw new Error('Expected the hidden Cobalt input');
    input.focus();
    expect(button).toHaveFocus();
  });

  it('does not close an open list when ArrowDown is pressed again', () => {
    render(
      <>
        <span id="agents-label">Agents</span>
        <MultiDropdown
          aria-labelledby="agents-label"
          options={options}
          onChange={vi.fn()}
        />
      </>
    );

    const button = screen.getByRole('button', { name: 'Agents' });
    const onTriggerClick = vi.fn();

    button.addEventListener('click', onTriggerClick);
    button.setAttribute('data-co-focus', 'true');
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    expect(onTriggerClick).not.toHaveBeenCalled();
  });
});

describe('MultiDropdown openOnContainerClick', () => {
  beforeEach(() => {
    cobalt.delayRoot = false;
  });

  it('attaches no container click handler by default', () => {
    renderDropdown();

    expect(cobalt.props?.onClick).toBeUndefined();
  });

  it('does not open when the container is clicked by default', () => {
    renderDropdown();
    const onTriggerClick = vi.fn();

    trigger().addEventListener('click', onTriggerClick);

    fireEvent.click(container());

    // Only the trigger can open the list, as it did before the prop existed.
    expect(onTriggerClick).not.toHaveBeenCalled();
  });

  it('forwards a container click to the trigger exactly once when opt-in', () => {
    renderDropdown(true);
    const onTriggerClick = vi.fn();

    trigger().addEventListener('click', onTriggerClick);

    fireEvent.click(container());

    expect(onTriggerClick).toHaveBeenCalledTimes(1);
  });

  it('does not double-toggle when the trigger itself is clicked while opt-in', () => {
    renderDropdown(true);
    const onTriggerClick = vi.fn();

    trigger().addEventListener('click', onTriggerClick);

    // The trigger stops its own click, so the container handler never sees it: one toggle, not two.
    fireEvent.click(trigger());

    expect(onTriggerClick).toHaveBeenCalledTimes(1);
  });
});
