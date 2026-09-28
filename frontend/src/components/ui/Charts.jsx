import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);
const PALETTE = ['#6366F1', '#4F46E5', '#16A34A', '#818CF8', '#A5B4FC', '#4338CA', '#3730A3', '#C7D2FE'];
export function BrandChart({ chart: ChartComp, labels, datasets, options, height = 260 }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const tick = dark ? '#94A3B8' : '#64748B';
  const grid = dark ? '#1E322B' : '#E8EEF3';
  const base = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: Boolean(datasets.length > 1), position: 'bottom', labels: { color: tick, boxWidth: 9, boxHeight: 9, usePointStyle: true, padding: 14, font: { size: 11 } } },
      tooltip: {
        backgroundColor: dark ? '#1A1F3A' : '#ffffff',
        titleColor: dark ? '#F1F5F9' : '#111827',
        bodyColor: dark ? '#CBD5E1' : '#475569',
        borderColor: grid,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tick, font: { size: 10.5 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 12 } },
      y: { beginAtZero: true, grid: { color: grid }, border: { display: false }, ticks: { color: tick, font: { size: 10.5 }, precision: 0 } }
    }
  };
  const merged = JSON.parse(JSON.stringify(base));
  if (options) Object.assign(merged, options);
  return (
    <div style={{ height }}>
      <ChartComp data={{ labels, datasets }} options={merged} />
    </div>
  );
}
export function ChartLine({ labels, series = [], options, height }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const datasets = series.map((s, i) => ({
    label: s.label || '',
    data: s.data,
    borderColor: s.color || PALETTE[i % PALETTE.length],
    backgroundColor: s.color ? `${s.color}22` : `${PALETTE[i % PALETTE.length]}22`,
    fill: s.fill !== undefined ? s.fill : false,
    tension: 0.35,
    pointRadius: 2.5,
    pointHoverRadius: 5,
    borderWidth: 2.2
  }));
  return <BrandChart chart={Line} labels={labels} datasets={datasets} options={options} height={height} />;
}
export function ChartBar({ labels, series = [], options, height }) {
  const datasets = series.map((s, i) => ({
    label: s.label || '',
    data: s.data,
    backgroundColor: s.color || PALETTE[i % PALETTE.length],
    borderRadius: 6,
    maxBarThickness: 34,
    barPercentage: 0.72
  }));
  return <BrandChart chart={Bar} labels={labels} datasets={datasets} options={options} height={height} />;
}
export function ChartDoughnut({ labels, data, colors = PALETTE, options, height }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const opts = {
    cutout: '64%',
    plugins: {
      legend: { display: true, position: 'bottom', labels: { color: dark ? '#94A3B8' : '#64748B', boxWidth: 9, boxHeight: 9, usePointStyle: true, padding: 12, font: { size: 11 } } },
      tooltip: {
        backgroundColor: dark ? '#1A1F3A' : '#ffffff',
        titleColor: dark ? '#F1F5F9' : '#111827',
        bodyColor: dark ? '#CBD5E1' : '#475569',
        borderColor: dark ? '#1E322B' : '#E8EEF3',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    }
  };
  if (options) Object.assign(opts, options);
  return (
    <div style={{ height }}>
      <Doughnut
        data={{ labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: dark ? '#12162B' : '#ffffff', hoverOffset: 6 }] }}
        options={opts}
      />
    </div>
  );
}
export { PALETTE };
