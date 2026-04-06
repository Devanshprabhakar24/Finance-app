import { lazy, Suspense } from 'react';

// Single lazy import for all recharts components
const BarChartImpl = lazy(() => import('./BarChartImpl'));

interface BarChartProps {
  data: any[];
  xDataKey: string;
  yDataKey: string;
  fill: string;
}

export function LazyBarChart(props: BarChartProps) {
  return (
    <Suspense fallback={<div className="skeleton h-48 w-full rounded-lg" />}>
      <BarChartImpl {...props} />
    </Suspense>
  );
}