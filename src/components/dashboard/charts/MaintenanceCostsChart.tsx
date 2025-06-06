
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MaintenanceCostsChartProps {
  data?: any[];
}

export const MaintenanceCostsChart = ({ data = [] }: MaintenanceCostsChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-muted-foreground text-xs" />
        <YAxis className="text-muted-foreground text-xs" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}
          formatter={(value) => [`$${value}`, '']}
        />
        <Legend />
        <Bar dataKey="service" name="Service" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="repairs" name="Repairs" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
