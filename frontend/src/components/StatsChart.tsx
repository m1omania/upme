import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface StatsChartProps {
  stats: any;
}

export default function StatsChart({ stats }: StatsChartProps) {
  // В реальном приложении здесь будут данные за период
  const data = [
    { name: 'Неделя 1', отклики: stats?.total || 0, просмотры: stats?.viewed || 0 },
    { name: 'Неделя 2', отклики: 0, просмотры: 0 },
    { name: 'Неделя 3', отклики: 0, просмотры: 0 },
    { name: 'Неделя 4', отклики: 0, просмотры: 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="отклики" stroke="hsl(var(--primary))" />
        <Line type="monotone" dataKey="просмотры" stroke="hsl(var(--secondary))" />
      </LineChart>
    </ResponsiveContainer>
  );
}
