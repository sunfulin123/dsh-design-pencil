/** Reference chart gallery: actual ECharts canvases with Cobalt framing and controls. */
import React, { useState } from 'react';
import Button from '@talkdesk/cobalt-react-button';
import Icon from '@talkdesk/cobalt-react-icon';
import { Heading, Text } from '@talkdesk/cobalt-react-typography';
import { Card } from '../components/extensions/src';
import { ReferenceChart, type ChartKind } from './support/reference-charts';
import './support/widget-gallery.css';
export default function EchartsGallery() {
  const [visible, setVisible] = useState<ChartKind[]>(['predicted', 'forecast', 'comparison']);
  return (
    <div className="widget-page" data-component="EchartsGallery">
      <header className="widget-page-header">
        <div>
          <Heading level={1}>ECharts gallery</Heading>
          <Text>Forecast, staffing and scenario comparison examples</Text>
        </div>
        <Button
          variation="outline"
          prefix={<Icon name="refresh" />}
          onPress={() => setVisible(['predicted', 'forecast', 'comparison'])}
        >
          Reset charts
        </Button>
      </header>
      <main className="widget-page-content">
        {visible.map((kind) => (
          <Card key={kind} padding="6">
            <div className="widget-heading">
              <Heading level={2}>
                {kind === 'predicted'
                  ? 'Contact volume and average handle time'
                  : kind === 'forecast'
                    ? 'Forecast and staffing'
                    : 'Scenario comparison'}
              </Heading>
              <Button
                variation="transparent"
                type="secondary"
                shape="compact"
                aria-label={`Remove ${kind} chart`}
                onPress={() => setVisible((items) => items.filter((value) => value !== kind))}
              >
                <Icon name="close" />
              </Button>
            </div>
            <ReferenceChart kind={kind} height={kind === 'forecast' ? 520 : 360} />
          </Card>
        ))}
        {!visible.length && (
          <Text>No charts selected. Use Reset charts to restore the examples.</Text>
        )}
      </main>
    </div>
  );
}
