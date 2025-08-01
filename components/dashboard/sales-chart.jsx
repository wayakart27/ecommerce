// components/dashboard/sales-chart.jsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SalesChart({ data, timeRange }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80">
        <p className="text-muted-foreground">No sales data available</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map(item => ({
    name: item.date,
    sales: item.sales
  }));

  // Format date labels based on time range
  const formatDateLabel = (dateStr) => {
    if (timeRange === 'year') {
      const [year, month] = dateStr.split('-');
      return `${year}-${month}`;
    }
    if (timeRange === 'month') {
      const date = new Date(dateStr);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }
    return dateStr;
  };

  // Custom tooltip formatter
  const formatTooltip = (value) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tickFormatter={formatDateLabel} 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => 
              new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(value)
            }
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value) => [formatTooltip(value), 'Sales']}
            labelFormatter={formatDateLabel}
          />
          <Bar 
            dataKey="sales"
            name="Sales" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}