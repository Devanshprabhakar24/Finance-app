import { lazy, Suspense } from 'react';

const BarChartComponent = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.BarChart }))
);

const BarComponent = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.Bar }))
);

const XAxisComponent = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.XAxis }))
);

const YAxisComponent = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.YAxis }))
);

const CartesianGridComponent = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.CartesianGrid }))
);

const TooltipComponent = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.Tooltip }))
);

const ResponsiveContainerComponent = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.ResponsiveContainer }))
);

export function LazyBarChart(props: any) {
  return (
    <Suspense fallback={<div className="skeleton h-48 w-full rounded-lg" />}>
      <ResponsiveContainerComponent width="100%" height={300}>
        <BarChartComponent data={props.data}>
          <CartesianGridComponent strokeDasharray="3 3" />
          <XAxisComponent dataKey={props.xDataKey} />
          <YAxisComponent />
          <TooltipComponent />
          <BarComponent dataKey={props.yDataKey} fill={props.fill} />
        </BarChartComponent>
      </ResponsiveContainerComponent>
    </Suspense>
  );
}