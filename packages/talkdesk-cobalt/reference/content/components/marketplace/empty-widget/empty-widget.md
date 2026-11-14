# EmptyWidget

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-empty-widget`
>
> Related (Empty state): [Empty States & Loading](../../../patterns/empty-states-and-loading/empty-states-and-loading.md).

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-empty-widget
```

```tsx
import EmptyWidget, { BadRequestWidget, NoResultsWidget, ServerErrorWidget } from "@talkdesk/cobalt-marketplace-react-empty-widget";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-emptywidget-stories--main)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-button`](../../../components/core/button/button.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-image`](../../../components/core/image/image.md), [`@talkdesk/cobalt-react-responsive-value-hook`](../../../hooks/core/responsive-value-hook/responsive-value-hook.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md), [`@talkdesk/cobalt-react-viewport-provider`](../../../providers/core/viewport-provider/viewport-provider.md).

## Guidance

EmptyWidget is a Cobalt Marketplace component for empty, error and no-results states.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The guidance for these states is in the [Empty States & Loading](/patterns/empty-states-and-loading/) pattern. EmptyWidget's own props and examples are in the Code tab.

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

### EmptyWidget

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `title` | string |  | yes |  |  |
| `message` | string |  | yes |  |  |
| `actionElement` | ReactNode |  | no |  |  |
| `children` | ReactNode |  | yes |  |  |

### BadRequestWidget

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `t` | (translationKey: string) => string |  | yes |  |  |
| `onRefresh` | () => void |  | no |  |  |

### NoResultsWidget

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `t` | (translationKey: string) => string |  | yes |  |  |

### ServerErrorWidget

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `t` | (translationKey: string) => string |  | yes |  |  |
| `onRefresh` | () => void |  | no |  |  |

## Examples

_3 of 5 compile against the published `@talkdesk/cobalt-marketplace-react-empty-widget@2.2.2` (React 18, TypeScript strict)._

### Main

> **Doesn't compile:** uses `Icon` without importing or defining it. Fix it before use.

```tsx
import EmptyWidget from "@talkdesk/cobalt-marketplace-react-empty-widget";

<EmptyWidget
  title="Empty state with icon"
  message="There was a problem loading voicemails."
>
  <Icon name="close_outline" size="xlarge" />
</EmptyWidget>
```

### Badrequest

```tsx
import {BadRequestWidget} from "@talkdesk/cobalt-marketplace-react-empty-widget";
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<BadRequestWidget t={t} />;
```

### Noresults

```tsx
import {NoResultsWidget} from "@talkdesk/cobalt-marketplace-react-empty-widget";
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<NoResultsWidget t={t} />;
```

### Servererror

```tsx
import {ServerErrorWidget} from "@talkdesk/cobalt-marketplace-react-empty-widget";
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<ServerErrorWidget t={t} />;
```

### Longmessage

> **Doesn't compile:** the published types reject it: Module '"@talkdesk/cobalt-marketplace-react-empty-widget"' has no exported member 'EmptyWidget'. Did you mean to use 'import EmptyWidget from "@talkdesk/cobalt-marketplace-react-empty-widget"' instead (it also uses `Icon` without importing it). Fix it before use.

```tsx
import { EmptyWidget } from "@talkdesk/cobalt-marketplace-react-empty-widget";

<EmptyWidget
  title="This is a simulated error with a long title."
  message="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud ..."
>
  <Icon name="close_outline" size="xlarge" />
</EmptyWidget>
```
