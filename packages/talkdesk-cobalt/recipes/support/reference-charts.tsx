/** ECharts compositions adapted from WFM chart patterns, with local deterministic sample data. */
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  GraphicComponent,
  AriaComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  GraphicComponent,
  AriaComponent,
  CanvasRenderer,
]);
export type ChartKind =
  | 'agents'
  | 'contacts'
  | 'sentiment'
  | 'predicted'
  | 'forecast'
  | 'comparison';
export function ReferenceChart({ kind, height = 320 }: { kind: ChartKind; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const chart = echarts.init(node);
    const draw = () => {
      const css = getComputedStyle(node),
        t = (key: string) => css.getPropertyValue(key).trim();
      const colors = {
        blue: t('--blue-9'),
        green: t('--green-9'),
        purple: t('--primary-9'),
        red: t('--red-9'),
        yellow: t('--yellow-9'),
        gray: t('--gray-8'),
        orange: t('--orange-9'),
      };
      const base: EChartsOption = {
        animation: false,
        backgroundColor: 'transparent',
        aria: { enabled: true },
        textStyle: { fontFamily: css.fontFamily, color: t('--text-default') },
        tooltip: {
          trigger: 'axis',
          renderMode: 'richText',
          backgroundColor: t('--background-color'),
          textStyle: { color: t('--text-default') },
          borderColor: t('--gray-4'),
        },
      };
      if (['agents', 'contacts', 'sentiment'].includes(kind)) {
        const items =
          kind === 'agents'
            ? [
                ['Available', 10, colors.green],
                ['ACW', 70, colors.purple],
                ['Busy', 15, colors.red],
                ['Away', 20, colors.yellow],
              ]
            : kind === 'contacts'
              ? [
                  ['Queued', 12, colors.red],
                  ['Ringing', 4, colors.gray],
                  ['In Progress', 35, colors.green],
                  ['ACW', 16, colors.purple],
                ]
              : [
                  ['Positive', 49, colors.green],
                  ['Neutral', 32, colors.gray],
                  ['Negative', 19, colors.red],
                ];
        const total =
          kind === 'sentiment'
            ? '49%'
            : String(items.reduce((sum, item) => sum + Number(item[1]), 0));
        chart.setOption(
          {
            ...base,
            tooltip: { ...base.tooltip, trigger: 'item' },
            legend:
              kind === 'sentiment'
                ? { show: false }
                : {
                    bottom: 0,
                    left: 'center',
                    icon: 'circle',
                    itemWidth: 10,
                    itemHeight: 10,
                    textStyle: { color: t('--text-description') },
                    formatter: (name: string) =>
                      `${items.find((item) => item[0] === name)?.[1]} ${name}`,
                  },
            graphic: [
              {
                type: 'text',
                left: 'center',
                top: kind === 'sentiment' ? '38%' : '40%',
                style: {
                  text: total,
                  fill: t('--text-default'),
                  fontSize: kind === 'sentiment' ? 24 : Math.min(96, height / 4),
                  fontFamily: css.fontFamily,
                  fontWeight: 400,
                },
              },
              {
                type: 'text',
                left: 'center',
                top: '61%',
                style: {
                  text: kind === 'sentiment' ? 'Positive' : '',
                  fill: t('--text-description'),
                  fontSize: 11,
                },
              },
            ],
            series: [
              {
                type: 'pie',
                radius: kind === 'sentiment' ? ['70%', '87%'] : ['65%', '78%'],
                center: ['50%', kind === 'sentiment' ? '50%' : '46%'],
                label: { show: false },
                data: items.map(([name, value, color]) => ({
                  name: String(name),
                  value: Number(value),
                  itemStyle: { color: String(color) },
                })),
              },
            ],
          },
          true,
        );
        return;
      }
      const labels = Array.from(
        { length: 96 },
        (_, i) =>
          `${Math.floor(i / 4) % 12 || 12}${i % 4 ? ':' + String((i % 4) * 15).padStart(2, '0') : ''} ${i < 48 ? 'AM' : 'PM'}`,
      );
      const cvo = labels.map((_, i) =>
        i < 32 || i >= 72 ? 170 : 250 + Math.round(Math.sin(i * 1.4) * 13) + (i > 36 ? 20 : 0),
      );
      const aht = labels.map((_, i) =>
        i < 32 || i >= 72 ? 850 : 680 + Math.round(Math.cos(i) * 14),
      );
      const axis = (name: string, index: number, max: number) => ({
        type: 'value' as const,
        name,
        min: 0,
        max,
        position: index % 2 ? ('right' as const) : ('left' as const),
        gridIndex: Math.floor(index / 2),
        nameLocation: 'middle' as const,
        nameGap: 40,
        axisLabel: { fontSize: 10, color: t('--text-description') },
        nameTextStyle: { color: t('--text-description') },
        splitLine: { show: index % 2 === 0, lineStyle: { color: t('--gray-3') } },
      });
      const x = (gridIndex: number) => ({
        type: 'category' as const,
        gridIndex,
        boundaryGap: false,
        data: kind === 'comparison' ? ['Wed, 9/23', 'Thu, 9/24'] : labels,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: t('--gray-4') } },
        axisLabel: { fontSize: 10, interval: 3, color: t('--text-description') },
      });
      const line = (
        name: string,
        data: number[],
        color: string,
        index: number,
        dashed = false,
        xIndex = 0,
      ) => ({
        name,
        type: 'line' as const,
        data,
        yAxisIndex: index,
        xAxisIndex: xIndex,
        symbol: 'none',
        lineStyle: { color, width: 1.5, type: dashed ? ('dashed' as const) : ('solid' as const) },
        itemStyle: { color },
      });
      const zoom = {
        type: 'slider' as const,
        bottom: 16,
        height: 24,
        left: 60,
        right: 60,
        showDetail: false,
        backgroundColor: t('--gray-3'),
        fillerColor: t('--primary-a4'),
        borderColor: t('--gray-4'),
      };
      if (kind === 'comparison') {
        chart.setOption(
          {
            ...base,
            grid: { left: 65, right: 65, top: 24, bottom: 96 },
            legend: {
              bottom: 40,
              textStyle: { color: t('--text-description') },
              data: [
                'Staffing | 00 scenario snapshot',
                'CVO | 00 scenario snapshot',
                'Staffing | 01 what if schedule',
                'CVO | 01 what if schedule',
              ],
            },
            xAxis: { ...x(0), axisLabel: { fontSize: 11, color: t('--text-description') } },
            yAxis: [{ ...axis('Staffing', 0, 6030), min: 5970 }, { ...axis('CVO', 1, 35000) }],
            dataZoom: [zoom, { type: 'inside' }],
            series: [
              line('Staffing | 00 scenario snapshot', [6024, 5980], t('--blue-7'), 0),
              line('CVO | 00 scenario snapshot', [31000, 22000], t('--blue-7'), 1, true),
              line('Staffing | 01 what if schedule', [5970, 5970], t('--green-7'), 0),
              line('CVO | 01 what if schedule', [0, 0], t('--green-7'), 1, true),
            ],
          },
          true,
        );
        return;
      }
      const forecast = kind === 'forecast';
      chart.setOption(
        {
          ...base,
          legend: {
            bottom: forecast ? 0 : 40,
            textStyle: { color: t('--text-description') },
            icon: 'circle',
            itemWidth: 10,
            itemHeight: 10,
          },
          grid: forecast
            ? [
                { left: 60, right: 60, top: 24, height: '36%' },
                { left: 60, right: 60, top: '55%', bottom: 65 },
              ]
            : { left: 60, right: 60, top: 24, bottom: 100 },
          xAxis: forecast ? [x(0), x(1)] : x(0),
          yAxis: forecast
            ? [
                axis('CVO', 0, 300),
                axis('AHT', 1, 1000),
                axis('Staff', 2, 400),
                axis('Unplanned shrinkage', 3, 30),
              ]
            : [axis('CVO', 0, 300), axis('AHT s', 1, 1000)],
          dataZoom: forecast ? [] : [zoom, { type: 'inside' }],
          series: forecast
            ? [
                line('Contact Volume Offered (CVO)', cvo, colors.blue, 0),
                line('Average Handle Time (AHT)', aht, colors.green, 1),
                line(
                  'Unplanned Shrinkage',
                  labels.map(() => 28),
                  colors.orange,
                  3,
                  false,
                  1,
                ),
                line(
                  'Planned Shrinkage',
                  labels.map(() => 25),
                  colors.purple,
                  3,
                  false,
                  1,
                ),
                line(
                  'Staff',
                  cvo.map((value) => value * 1.25),
                  colors.yellow,
                  2,
                  false,
                  1,
                ),
              ]
            : [
                line('CVO | Predicted | Total 20114', cvo, colors.blue, 0, true),
                line('CVO | History | Total 0', [], colors.blue, 0),
                line('AHT | Predicted | Average 759s', aht, colors.green, 1, true),
                line('AHT | History | Average 0s', [], colors.green, 1),
              ],
        },
        true,
      );
    };
    draw();
    const resize = new ResizeObserver(() => chart.resize());
    resize.observe(node);
    const observer = new MutationObserver(draw);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-co-colorscheme', 'class', 'style'],
    });
    const stylesheet = document.getElementById('atlas-theme');
    stylesheet?.addEventListener('load', draw);
    return () => {
      resize.disconnect();
      observer.disconnect();
      stylesheet?.removeEventListener('load', draw);
      chart.dispose();
    };
  }, [kind, height]);
  return (
    <div
      ref={ref}
      role="img"
      aria-label={`${kind} chart`}
      data-testid={`chart-${kind}`}
      style={{ width: '100%', height, minWidth: 0 }}
    />
  );
}
