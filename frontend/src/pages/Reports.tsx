import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  Utensils,
  Calendar,
  Clock,
  Award,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  useFetchReportOrders,
  useFetchReportOrderItems,
  aggregateDailySales,
  aggregateTopItems,
  aggregateCategorySales,
  aggregateHourlySales,
  computeSummaryStats,
} from "@/services/reportService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const CHART_COLORS = [
  "#f97316", // orange
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#eab308", // yellow
  "#ef4444", // red
  "#3b82f6", // blue
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
              {label}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const Reports = () => {
  const [days, setDays] = useState(30);
  const { data: orders, isLoading: ordersLoading } = useFetchReportOrders();
  const { data: orderItems, isLoading: itemsLoading } =
    useFetchReportOrderItems();

  const dailySales = useMemo(
    () => aggregateDailySales(orders ?? [], days),
    [orders, days],
  );
  const topItems = useMemo(
    () => aggregateTopItems(orderItems ?? [], 10),
    [orderItems],
  );
  const categorySales = useMemo(
    () => aggregateCategorySales(orderItems ?? []),
    [orderItems],
  );
  const hourlySales = useMemo(
    () => aggregateHourlySales(orders ?? []),
    [orders],
  );
  const stats = useMemo(
    () => computeSummaryStats(orders ?? [], orderItems ?? []),
    [orders, orderItems],
  );

  const isLoading = ordersLoading || itemsLoading;

  return (
    <div className="orders-list space-y-6 p-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sales performance, top items and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={TrendingUp}
              label="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              color="#10b981"
            />
            <StatCard
              icon={Receipt}
              label="Total Orders"
              value={stats.totalOrders.toLocaleString()}
              color="#f97316"
            />
            <StatCard
              icon={ShoppingBag}
              label="Avg. Ticket"
              value={formatCurrency(stats.averageTicket)}
              color="#8b5cf6"
            />
            <StatCard
              icon={Utensils}
              label="Items Sold"
              value={stats.totalItemsSold.toLocaleString()}
              color="#06b6d4"
            />
          </>
        )}
      </div>

      {/* Daily revenue area chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Revenue Trend (Last {days} days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : dailySales.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailySales}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top items bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-purple-500" />
              Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : topItems.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={topItems}
                  layout="vertical"
                  margin={{ left: 80, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChartIcon className="h-5 w-5 text-emerald-500" />
              Sales by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : categorySales.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={categorySales}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    label={(entry) =>
                      `${entry.name}: ${formatCurrency(entry.revenue as number)}`
                    }
                    labelLine={false}
                  >
                    {categorySales.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly sales heat strip */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-cyan-500" />
            Sales by Hour of Day
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : hourlySales.every((h) => h.orders === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={hourlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "revenue"
                      ? formatCurrency(value)
                      : `${value} orders`
                  }
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Revenue (€)"
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top items table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5 text-orange-500" />
            Item Performance Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : topItems.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity Sold
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topItems.map((item, index) => {
                    const pct =
                      stats.totalRevenue > 0
                        ? (item.revenue / stats.totalRevenue) * 100
                        : 0;
                    return (
                      <tr key={item.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold text-white"
                            style={{
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-right">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(item.revenue)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  backgroundColor:
                                    CHART_COLORS[index % CHART_COLORS.length],
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-10">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const EmptyChart = () => (
  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
    <PieChartIcon className="h-12 w-12 mb-3 opacity-30" />
    <p className="text-lg">No data available</p>
    <p className="text-sm">Complete some orders to see analytics here.</p>
  </div>
);

export default Reports;
