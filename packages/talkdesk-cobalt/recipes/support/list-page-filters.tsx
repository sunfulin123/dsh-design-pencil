/** Draft filters apply atomically; dismissing the panel preserves the current results. */
import React, { useState } from 'react';
import Flex from '@talkdesk/cobalt-react-flex';
import { Checkbox } from '@talkdesk/cobalt-react-checkbox';
import { SidePanel, FormField } from '../../components/extensions/src';
export function ListPageFilters({ active, onApply, onClose }: {
 active: boolean; onApply: (active: boolean) => void; onClose: () => void;
}) {
 const [draft, setDraft] = useState(active);
 return <SidePanel visible title="Filters" closeLabel="Close user filters" onClose={onClose}
   data-qa="list-filters-panel" actions={[
     { label: 'Reset', onClick: () => setDraft(false) },
     { label: 'Cancel', onClick: onClose },
     { label: 'Apply filters', type: 'primary', onClick: () => onApply(draft) },
   ]}>
   <form aria-label="User filters" onSubmit={event => { event.preventDefault(); onApply(draft); }}>
     <Flex direction="column" gap={4} width="100%"><FormField label="Activation">
       <Checkbox isSelected={draft} onChange={setDraft}>Active users only</Checkbox>
     </FormField></Flex>
   </form>
 </SidePanel>;
}
