/** Cobalt filter action with a local badge anchor that survives responsive toolbar wrapping. */
import React from 'react';
import Button from '@talkdesk/cobalt-react-button';
import Icon from '@talkdesk/cobalt-react-icon';
import BadgeContainerWrapper from '@talkdesk/cobalt-marketplace-react-badge-container';
import { useViewport } from '@talkdesk/cobalt-react-viewport-provider';
export function FilterButton({
  activeCount,
  onPress,
  size = 'small',
}: {
  activeCount: number;
  onPress: () => void;
  size?: 'small' | 'medium';
}) {
  const small = useViewport() === 'small';
  // Rebind the native measured anchor after changing between labelled and icon-only buttons.
  return (
    <BadgeContainerWrapper
      key={small ? 'compact' : 'labelled'}
      color="theme"
      size="tiny"
      badgeNumber={activeCount}
      originPosition="NE"
      directionPosition="NW"
      gapY={8}
      gapX={0}
    >
      <Button
        size={size}
        type="secondary"
        variation="transparent"
        shape={small ? 'compact' : undefined}
        aria-label="Filters"
        onPress={onPress}
        prefix={<Icon name="filter_list" size={size === 'medium' ? 'small' : 'tiny'} />}
      >
        {small ? null : 'Filters'}
      </Button>
    </BadgeContainerWrapper>
  );
}
