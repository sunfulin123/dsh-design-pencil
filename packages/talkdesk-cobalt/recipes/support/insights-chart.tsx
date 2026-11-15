/** Local ECharts renderer: semantic theme tokens, container resize and deterministic demo data. */
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  AriaComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  AriaComponent,
  CanvasRenderer,
]);
export type InsightsRange = 'Day' | 'Week' | 'Month';
export function InsightsChart({
  date,
  range,
  partial,
  revision,
}: {
  date: Date;
  range: InsightsRange;
  partial: boolean;
  revision: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const chart = echarts.init(node);
    const render = () => {
      const css = getComputedStyle(node);
      const token = (name: string) => css.getPropertyValue(name).trim();
      const labels = Array.from(
        { length: range === 'Day' ? 96 : range === 'Week' ? 7 : 30 },
        (_, i) =>
          range === 'Day'
            ? `${Math.floor(i / 4) % 12 || 12}${i % 4 ? `:${(i % 4) * 15}` : ''} ${i < 48 ? 'AM' : 'PM'}`
            : new Date(date.getFullYear(), date.getMonth(), date.getDate() + i).toLocaleDateString(
                'en-US',
                { month: 'short', day: 'numeric' },
              ),
      );
      const values = labels.map((_, i) => {
        const hour = (i * 24) / labels.length;
        return hour < 8 || hour >= 18
          ? 320
          : hour < 9
            ? 248
            : 227 + Math.round(Math.sin(i * 2.3) * 7);
      });
      const colors = [token('--primary-7'), token('--gray-9')];
      chart.setOption(
        {
          backgroundColor: 'transparent',
          color: colors,
          animation: false,
          aria: {
            enabled: true,
            label: {
              description:
                'Predicted average time to abandon and average wait time in seconds. Both are around 320 overnight and 230 during business hours.',
            },
          },
          tooltip: {
            trigger: 'axis',
            backgroundColor: token('--surface-elevation-1'),
            borderColor: token('--gray-4'),
            textStyle: { color: token('--text-default'), fontSize: 12 },
            axisPointer: { type: 'line', lineStyle: { color: token('--gray-8'), type: 'dashed' } },
          },
          legend: {
            bottom: 42,
            left: 'center',
            itemWidth: 14,
            itemHeight: 14,
            itemGap: 16,
            icon: 'circle',
            textStyle: { color: token('--text-description'), fontSize: 12 },
            data: [
              'ATA | Predicted | Average 273s',
              ...(partial ? [] : ['AWT | Predicted | Average 273s']),
            ].map((name, index) => ({
              name,
              itemStyle: {
                color: 'transparent',
                borderColor: colors[index],
                borderWidth: 1,
                borderType: 'dashed',
              },
            })),
          },
          grid: { left: 55, right: 55, top: 28, bottom: 110, containLabel: true },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: labels,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: token('--gray-4') } },
            axisLabel: {
              color: token('--text-placeholder'),
              fontSize: 10,
              showMinLabel: true,
              hideOverlap: true,
              interval: range === 'Day' ? 3 : 'auto',
            },
          },
          yAxis: ['ATA s', 'AWT s'].map((name, i) => ({
            name,
            type: 'value',
            min: 0,
            max: 350,
            interval: 50,
            position: i ? 'right' : 'left',
            nameLocation: 'middle',
            nameGap: 42,
            nameTextStyle: { color: token('--text-description'), fontWeight: 600, fontSize: 12 },
            axisLabel: { color: token('--text-placeholder'), fontSize: 10 },
            splitLine: { show: !i, lineStyle: { color: token('--gray-3') } },
          })),
          dataZoom: [
            { type: 'inside', start: 0, end: 100 },
            {
              type: 'slider',
              left: 55,
              right: 55,
              bottom: 16,
              height: 28,
              start: 0,
              end: 100,
              showDetail: false,
              borderColor: 'transparent',
              backgroundColor: token('--gray-3'),
              fillerColor: token('--primary-a4'),
              handleStyle: {
                color: token('--surface-elevation-1'),
                borderColor: token('--primary-7'),
              },
            },
          ],
          series: [0, ...(partial ? [] : [1])].map((i) => ({
            name: i ? 'AWT | Predicted | Average 273s' : 'ATA | Predicted | Average 273s',
            type: 'line',
            yAxisIndex: i,
            data: values,
            symbol: 'none',
            lineStyle: { type: 'dashed', width: 2 },
            emphasis: { focus: 'series' },
          })),
        },
        true,
      );
    };
    render();
    // Theme CSS can arrive after the canvas mounts; redraw with its resolved tokens.
    const stylesheet = document.getElementById('atlas-theme');
    stylesheet?.addEventListener('load', render);
    const resize = new ResizeObserver(() => chart.resize());
    resize.observe(node);
    const theme = new MutationObserver(render);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-co-colorscheme', 'style', 'class'],
    });
    return () => {
      stylesheet?.removeEventListener('load', render);
      resize.disconnect();
      theme.disconnect();
      chart.dispose();
    };
  }, [date, range, partial, revision]);
  return (
    <div
      ref={host}
      data-testid="insights-chart"
      role="img"
      aria-label="Predicted ATA and AWT line chart"
      style={{ width: '100%', height: 400, minWidth: 0 }}
    />
  );
}
