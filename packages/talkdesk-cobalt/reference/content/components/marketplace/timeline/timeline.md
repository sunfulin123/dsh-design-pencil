# Timeline

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-timeline`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v1.0.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-timeline
```

```tsx
import Timeline, { Item, Collapsed, Footer, useCollapsibleHeadPinned } from "@talkdesk/cobalt-marketplace-react-timeline";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-timeline-stories--basic)

## Guidance

Timeline is a Cobalt Marketplace component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for Timeline yet. Its props and examples are in the Code tab, and its Storybook is linked above.

### Code

### Props

### Examples

### Content

### Writing guidelines

This component has no component-specific copy rules yet. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

This component has no component-specific accessibility guidance yet. For guidance that applies
to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

### Timeline

_Also accepts the standard `HTMLAttributes<TimelineType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `type` | enum | `secondary`, `primary` | no | secondary |  |
| `forwardedRef` | Ref<HTMLUListElement> |  | no |  |  |
| `children` | ReactNode |  | no |  |  |

### Item

_Also accepts the standard `Omit<HTMLAttributes<ItemType>, "title">` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `caption` | ReactNode |  | no |  |  |
| `title` | ReactNode |  | no |  |  |
| `meta` | ReactNode |  | no |  |  |
| `aside` | ReactNode |  | no |  |  |
| `variant` | enum | `solid`, `dotted` | no | solid |  |
| `expanded` | boolean |  | no | false |  |
| `onToggle` | () => void |  | no |  |  |
| `bodyActions` | ReactNode |  | no |  | Optional slot rendered as a floating action group in the top-right of the body. The body becomes interactive: hovering or focusing within it paints a hover background and reveals the actions. Typically used for affordances like "copy note to clipboard". |
| `forwardedRef` | Ref<HTMLLIElement> |  | no |  |  |
| `children` | ReactNode |  | no |  |  |

### Collapsed

_Also accepts the standard `HTMLAttributes<CollapsedType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `children` | ReactNode |  | yes |  | The toggle UI rendered inside the collapsed row's content slot. Consumers compose their own button (e.g. Cobalt `<Button />`) so the Timeline package stays self-contained. |
| `forwardedRef` | Ref<HTMLLIElement> |  | no |  |  |

### Footer

_Also accepts the standard `HTMLAttributes<FooterType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `forwardedRef` | Ref<HTMLLIElement> |  | no |  |  |
| `children` | ReactNode |  | no |  |  |

## Examples

_7 of 8 compile against the published `@talkdesk/cobalt-marketplace-react-timeline@1.0.2` (React 18, TypeScript strict)._

### Basic

```tsx
import Timeline, { Item, Collapsed, Footer } from "@talkdesk/cobalt-marketplace-react-timeline";

<Timeline>
  <Item caption="11:42" title="Call answered" aside="42s" />
  <Item caption="11:43" title="Customer placed on hold" aside="12s" />
  <Item caption="11:44" title="Call ended" aside="—" />
</Timeline>;
```

### Expandable

```tsx
import Timeline, { Item, Collapsed, Footer } from "@talkdesk/cobalt-marketplace-react-timeline";

const [open, setOpen] = useState(false);

<Timeline>
  <Item
    caption="11:42"
    title="Call answered"
    aside="42s"
    expanded={open}
    onToggle={() => setOpen(o => !o)}
  >
    <p>Routed by IVR queue "Support".</p>
  </Item>
</Timeline>;
```

### Collapsed section

```tsx
import Timeline, { Item, Collapsed, Footer } from "@talkdesk/cobalt-marketplace-react-timeline";

<Timeline>
  <Item caption="11:42" title="Call answered" />
  <Collapsed>
    <button type="button" onClick={() => {}}>
      Show 3 hidden events
    </button>
  </Collapsed>
  <Item caption="11:46" title="Call ended" />
</Timeline>;
```

### Dotted

```tsx
import Timeline, { Item, Collapsed, Footer } from "@talkdesk/cobalt-marketplace-react-timeline";

<Timeline>
  <Item title="Solid" />
  <Item title="Dotted (in progress)" variant="dotted" />
</Timeline>;
```

### Primary type

```tsx
import Timeline, { Item, Collapsed, Footer } from "@talkdesk/cobalt-marketplace-react-timeline";

<Timeline type="primary">
  <Item title="Highlighted" />
  <Item title="Also primary" />
</Timeline>;
```

### With footer

```tsx
import Timeline, { Item, Collapsed, Footer } from "@talkdesk/cobalt-marketplace-react-timeline";

<Timeline>
  <Item title="Note 1" />
  <Item title="Note 2" />
  <Footer>
    <button>Add note</button>
  </Footer>
</Timeline>;
```

### With cobalt icons

```tsx
import Timeline, { Item } from "@talkdesk/cobalt-marketplace-react-timeline";
import { Icon, IconsProvider } from "@talkdesk/cobalt-react-icon";

<IconsProvider>
  <Timeline>
    <Item
      caption={<><Icon name="swap_horiz" size="tiny" /> 11:42</>}
      title="Transferred to Bob"
      aside="3m"
    />
  </Timeline>
</IconsProvider>;
```

### Full call timeline

> **Doesn't compile:** the published types reject it: JSX element type 'Tag' does not have any construct or call signatures.. Fix it before use.

```tsx
import Timeline, { Item, Collapsed } from "@talkdesk/cobalt-marketplace-react-timeline";
import { Icon, IconsProvider } from "@talkdesk/cobalt-react-icon";
import { Heading, Text } from "@talkdesk/cobalt-react-typography";
import Tag from "@talkdesk/cobalt-react-tag";
import Flex from "@talkdesk/cobalt-react-flex";
import Button from "@talkdesk/cobalt-react-button";

const TransferCaption = ({ label }: { label: string }) => (
  <><Icon name="swap_horiz" size="tiny" /> {label}</>
);

const queueChip = (
  <Tag size="tiny" color="light-gray" style={{ alignSelf: "flex-start" }}>
    Sales · NA
  </Tag>
);

<IconsProvider>
  <Heading level="6">Call timeline</Heading>
  <Timeline type="primary">
    <Item
      caption={<TransferCaption label="Transferred to" />}
      title="John Smith (You)"
      meta={queueChip}
      aside="Just now"
    />
    <Item
      caption={<TransferCaption label="Transferred to" />}
      title="Bernard Norris"
      meta={queueChip}
      aside={
        <Flex direction="column" alignX="end" gap="0">
          <Text size="small" inline>6 minutes ago</Text>
          <Button
            type="primary"
            variation="transparent"
            size="tiny"
            onClick={() => setOpen(o => !o)}
            onMouseDown={e => e.preventDefault()}
          >
            {open ? "Hide notes" : "Show notes"}
          </Button>
        </Flex>
      }
      expanded={open}
      onToggle={() => setOpen(o => !o)}
      bodyActions={
        <Button
          type="secondary"
          variation="transparent"
          size="small"
          onClick={() => navigator.clipboard?.writeText("...")}
          onMouseDown={e => e.preventDefault()}
          aria-label="Copy note to clipboard"
        >
          <Icon name="copy" size="small" />
        </Button>
      }
    >
      <Text size="small">
        Customer asked about renewal pricing. Promised follow-up by EOD.
      </Text>
    </Item>
    <Collapsed>
      <Button variation="transparent" size="small" type="primary">
        Show all (+3 transfers)
      </Button>
    </Collapsed>
    <Item
      caption={<TransferCaption label="Transferred to" />}
      title="Bernard Norris"
      meta={queueChip}
      aside={
        <Flex direction="column" alignX="end" gap="0">
          <Text size="small" inline>6 minutes ago</Text>
          <Text size="small" inline color="var(--gray-11, var(--gray-700, #606569))">No notes</Text>
        </Flex>
      }
    />
  </Timeline>
</IconsProvider>;
```
