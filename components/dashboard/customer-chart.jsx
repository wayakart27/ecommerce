// components/dashboard/customer-chart.jsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CustomerChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80">
        <p className="text-muted-foreground">No order history available</p>
      </div>
    );
  }

  // Format data for chart with Naira currency
  const chartData = data.map(item => ({
    month: item.month,
    orders: item.orders,
    total: item.total,
    // Add formatted total for display
    formattedTotal: new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(item.total)
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-md shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="mt-1">
              {entry.dataKey === 'orders' ? (
                <p className="text-indigo-600">
                  Orders: <span className="font-medium">{entry.value}</span>
                </p>
              ) : (
                <p className="text-emerald-600">
                  Total: <span className="font-medium">
                    {new Intl.NumberFormat('en-NG', {
                      style: 'currency',
                      currency: 'NGN',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(entry.value)}
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => 
              new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(value).replace('NGN', '₦')
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            yAxisId="left"
            dataKey="orders" 
            name="Orders" 
            fill="#4f46e5" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="total" 
            name="Total" 
            fill="#10b981" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}