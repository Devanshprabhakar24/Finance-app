import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BarChartImplProps {
  data: any[];
  xDataKey: string;
  yDataKey: string;
  fill: string;
}

export default function BarChartImpl({ data, xDataKey, yDataKey, fill }: BarChartImplProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xDataKey} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={yDataKey} fill={fill} />
      </BarChart>
    </ResponsiveContainer>
  );
}