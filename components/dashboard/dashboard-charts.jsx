"use client";

import React from "react";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const salesData = [
  { name: "Jan", sales: 4000, returns: 400 },
  { name: "Feb", sales: 3000, returns: 300 },
  { name: "Mar", sales: 5000, returns: 250 },
  { name: "Apr", sales: 4500, returns: 320 },
  { name: "May", sales: 6000, returns: 400 },
  { name: "Jun", sales: 5500, returns: 350 },
];

const categoryData = [
  { name: "Electronics", value: 40 },
  { name: "Clothing", value: 30 },
  { name: "Accessories", value: 15 },
  { name: "Home", value: 10 },
  { name: "Fitness", value: 5 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function SalesChart() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={salesData}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
        <XAxis
          dataKey="name"
          stroke="#888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#1f2937" : "#fff",
            border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            borderRadius: "6px",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          }}
          formatter={(value) => [`$${value}`, ""]}
        />
        <Legend />
        <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="returns" name="Returns" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={categoryData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {categoryData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value}%`, "Sales"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CustomerChart() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const customerData = [
    { month: "Jan", new: 65, returning: 120 },
    { month: "Feb", new: 78, returning: 132 },
    { month: "Mar", new: 90, returning: 145 },
    { month: "Apr", new: 81, returning: 160 },
    { month: "May", new: 95, returning: 175 },
    { month: "Jun", new: 110, returning: 190 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={customerData}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
        <XAxis
          dataKey="month"
          stroke="#888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#1f2937" : "#fff",
            border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            borderRadius: "6px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="new"
          name="New Customers"
          stroke="#3b82f6"
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="returning"
          name="Returning Customers"
          stroke="#10b981"
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
