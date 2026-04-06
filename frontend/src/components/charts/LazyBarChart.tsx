import { lazy, Suspense } from 'react';

// Single lazy import for all recharts components
const BarChartImpl = lazy(() => import('./BarChartImpl'));

export function LazyBarChart(props: any) {
  return (
    <Suspense fallback={<div className="skeleton h-48 w-full rounded-lg" />}>
      <BarChartImpl {...props} />
    </Suspense>
  );
}