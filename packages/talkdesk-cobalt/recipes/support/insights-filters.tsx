/** Agent selection is a searchable source-template MultiDropdown; Apply commits its draft. */
import React, { useState } from 'react';
import { SidePanel, FormField, MultiDropdown } from '../../components/extensions/src';
export const SAMPLE_AGENTS = Array.from({ length: 37 }, (_, i) => `agent${i + 1}`);
const AGENT_OPTIONS = SAMPLE_AGENTS.map(agent => ({ value: agent, label: agent }));
export function InsightsFilters({ selected, onApply, onClose }: {
  selected: string[]; onApply: (agents: string[]) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(selected);
  return <SidePanel visible title="Insight filters" closeLabel="Close insight filters" onClose={onClose}
    actions={[{ label: 'Clear', onClick: () => setDraft([]) }, { label: 'Apply filters', type: 'primary', onClick: () => onApply(draft) }]}>
    <FormField label={<span id="insights-agents-label">Agents</span>}>
      <MultiDropdown aria-labelledby="insights-agents-label" data-qa="insights-agents" value={draft}
        options={AGENT_OPTIONS} searchable renderSelectAll dismissValues maxVisibleValues={3} inputSize="small"
        messages={{ placeholder: 'Select agents', searchPlaceholder: 'Search agents' }}
        onChange={values => setDraft(values.filter((value): value is string => typeof value === 'string'))}/>
    </FormField>
  </SidePanel>;
}
