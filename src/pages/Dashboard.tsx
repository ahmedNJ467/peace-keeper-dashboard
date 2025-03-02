import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Car, Users, Wrench, Fuel, TrendingUp, TrendingDown, Bell, Calendar, BarChart2, PieChart, Activity, DollarSign, CreditCard, Wallet } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartPieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from "@/integrations/supabase/client";

const monthlyData = [
  { month: "Jan", vehicles: 20, maintenance: 2, revenue: 15000, costs: 9000, profit: 6000 },
  { month: "Feb", vehicles: 22, maintenance: 3, revenue: 16500, costs: 10200, profit: 6300 },
  { month: "Mar", vehicles: 21, maintenance: 2, revenue: 15800, costs: 9500, profit: 6300 },
  { month: "Apr", vehicles: 23, maintenance: 4, revenue: 17200, costs: 10800, profit: 6400 },
  { month: "May", vehicles: 24, maintenance: 3, revenue: 18000, costs: 11000, profit: 7000 },
  { month: "Jun", vehicles: 24, maintenance: 3, revenue: 18500, costs: 11200, profit: 7300 },
];

const fuelConsumptionData = [
  { month: "Jan", consumption: 2500 },
  { month: "Feb", consumption: 2300 },
  { month: "Mar", consumption: 2400 },
  { month: "Apr", consumption: 2200 },
  { month: "May", consumption: 2100 },
  { month: "Jun", consumption: 2000 },
];

const fleetDistributionData = [
  { name: "Sedans", value: 10, color: "#10B981" },
  { name: "SUVs", value: 7, color: "#3B82F6" },
  { name: "Trucks", value: 4, color: "#8B5CF6" },
  { name: "Vans", value: 3, color: "#F97316" },
];

const driverStatusData = [
  { name: "Active", value: 18, color: "#10B981" },
  { name: "On Leave", value: 3, color: "#F97316" },
  { name: "Inactive", value: 2, color: "#EF4444" },
];

// Add new data structures for maintenance and fuel costs
const maintenanceCostData = [
  { month: "Jan", preventive: 1200, repairs: 800, total: 2000 },
  { month: "Feb", preventive: 800, repairs: 1400, total: 2200 },
  { month: "Mar", preventive: 1000, repairs: 600, total: 1600 },
  { month: "Apr", preventive: 900, repairs: 1100, total: 2000 },
  { month: "May", preventive: 1200, repairs: 700, total: 1900 },
  { month: "Jun", preventive: 1100, repairs: 800, total: 1900 },
];

const fuelCostData = [
  { month: "Jan", diesel: 1500, petrol: 1000, total: 2500 },
  { month: "Feb", diesel: 1400, petrol: 900, total: 2300 },
  { month: "Mar", diesel: 1600, petrol: 800, total: 2400 },
  { month: "Apr", diesel: 1300, petrol: 900, total: 2200 },
  { month: "May", diesel: 1200, petrol: 900, total: 2100 },
  { month: "Jun", diesel: 1100, petrol: 900, total: 2000 },
];

// Cost breakdown by vehicle type
const costsByVehicleType = [
  { name: "Sedans", maintenance: 4500, fuel: 6000, color: "#10B981" },
  { name: "SUVs", maintenance: 5200, fuel: 8200, color: "#3B82F6" },
  { name: "Trucks", maintenance: 7800, fuel: 9500, color: "#8B5CF6" },
  { name: "Vans", maintenance: 3800, fuel: 5200, color: "#F97316" },
];

export default function Dashboard() {
  const [stats, setStats] = useState([
    {
      name: "Total Vehicles",
      value: "24",
      icon: Car,
      change: "+2.5%",
      changeType: "positive",
    },
    {
      name: "Active Drivers",
      value: "18",
      icon: Users,
      change: "0%",
      changeType: "neutral",
    },
    {
      name: "Maintenance Due",
      value: "3",
      icon: Wrench,
      change: "-1",
      changeType: "negative",
    },
    {
      name: "Fuel Efficiency",
      value: "92%",
      icon: Fuel,
      change: "+4.3%",
      changeType: "positive",
    },
  ]);
  
  const [financialStats, setFinancialStats] = useState([
    {
      name: "Revenue (USD)",
      value: "$18,500",
      icon: DollarSign,
      change: "+2.8%",
      changeType: "positive",
    },
    {
      name: "Costs (USD)",
      value: "$11,200",
      icon: CreditCard,
      change: "+1.8%",
      changeType: "negative",
    },
    {
      name: "Profit (USD)",
      value: "$7,300",
      icon: Wallet,
      change: "+4.3%",
      changeType: "positive",
    },
  ]);
  
  const [recentAlerts, setRecentAlerts] = useState([
    { id: 1, title: "Vehicle KSB 123G due for service", priority: "high", date: "Today" },
    { id: 2, title: "Driver license expiring", priority: "medium", date: "Tomorrow" },
    { id: 3, title: "Fuel consumption above average", priority: "low", date: "2 days ago" },
  ]);

  const [upcomingTrips, setUpcomingTrips] = useState([
    { id: 1, client: "Acme Corp", destination: "Nairobi CBD", date: "Today, 2:00 PM", driver: "John Doe" },
    { id: 2, client: "XYZ Industries", destination: "Mombasa Road", date: "Tomorrow, 9:00 AM", driver: "Jane Smith" },
    { id: 3, client: "Global Enterprises", destination: "Karen", date: "Jun 15, 10:30 AM", driver: "David Johnson" },
  ]);
  
  const [costsBreakdown, setCostsBreakdown] = useState({
    maintenance: {
      preventive: 5200,
      repairs: 4400,
      total: 9600
    },
    fuel: {
      diesel: 7600,
      petrol: 5400,
      total: 13000
    }
  });

  useEffect(() => {
    const vehiclesChannel = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vehicles' 
      }, (payload) => {
        console.log('Vehicles change received:', payload);
        fetchDashboardData();
      })
      .subscribe();

    const driversChannel = supabase
      .channel('drivers-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'drivers' 
      }, (payload) => {
        console.log('Drivers change received:', payload);
        fetchDashboardData();
      })
      .subscribe();
      
    // Add listeners for maintenance and fuel logs tables
    const maintenanceChannel = supabase
      .channel('maintenance-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'maintenance' 
      }, (payload) => {
        console.log('Maintenance change received:', payload);
        fetchDashboardData();
      })
      .subscribe();
      
    const fuelLogsChannel = supabase
      .channel('fuel-logs-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'fuel_logs' 
      }, (payload) => {
        console.log('Fuel log change received:', payload);
        fetchDashboardData();
      })
      .subscribe();

    fetchDashboardData();

    return () => {
      supabase.removeChannel(vehiclesChannel);
      supabase.removeChannel(driversChannel);
      supabase.removeChannel(maintenanceChannel);
      supabase.removeChannel(fuelLogsChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
      const newStats = [...stats];
      const randomStatIndex = Math.floor(Math.random() * newStats.length);
      
      if (randomStatIndex === 0) {
        const newValue = parseInt(newStats[randomStatIndex].value) + (Math.random() > 0.5 ? 1 : -1);
        newStats[randomStatIndex].value = newValue.toString();
        newStats[randomStatIndex].change = `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(1)}%`;
        newStats[randomStatIndex].changeType = Math.random() > 0.5 ? 'positive' : 'negative';
      }
      
      setStats(newStats);
      
      const newFinancialStats = [...financialStats];
      const randomFinancialIndex = Math.floor(Math.random() * newFinancialStats.length);
      const currentValue = parseFloat(newFinancialStats[randomFinancialIndex].value.replace('$', '').replace(',', ''));
      const newValue = currentValue + (Math.random() > 0.5 ? 100 : -100);
      newFinancialStats[randomFinancialIndex].value = `$${newValue.toLocaleString()}`;
      newFinancialStats[randomFinancialIndex].change = `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(1)}%`;
      newFinancialStats[randomFinancialIndex].changeType = newFinancialStats[randomFinancialIndex].name === "Costs (USD)" 
        ? (newFinancialStats[randomFinancialIndex].change.startsWith('+') ? 'negative' : 'positive')
        : (newFinancialStats[randomFinancialIndex].change.startsWith('+') ? 'positive' : 'negative');
      
      setFinancialStats(newFinancialStats);
      
      // Update costs breakdown with random changes for demo purposes
      // In a real app, this would fetch actual data from Supabase
      const updatedCostsBreakdown = { ...costsBreakdown };
      
      // Randomly update maintenance costs
      if (Math.random() > 0.5) {
        const changeAmount = Math.floor(Math.random() * 200);
        updatedCostsBreakdown.maintenance.preventive += Math.random() > 0.5 ? changeAmount : -changeAmount;
        updatedCostsBreakdown.maintenance.repairs += Math.random() > 0.5 ? changeAmount : -changeAmount;
        updatedCostsBreakdown.maintenance.total = 
          updatedCostsBreakdown.maintenance.preventive + updatedCostsBreakdown.maintenance.repairs;
      }
      
      // Randomly update fuel costs
      if (Math.random() > 0.5) {
        const changeAmount = Math.floor(Math.random() * 200);
        updatedCostsBreakdown.fuel.diesel += Math.random() > 0.5 ? changeAmount : -changeAmount;
        updatedCostsBreakdown.fuel.petrol += Math.random() > 0.5 ? changeAmount : -changeAmount;
        updatedCostsBreakdown.fuel.total = 
          updatedCostsBreakdown.fuel.diesel + updatedCostsBreakdown.fuel.petrol;
      }
      
      setCostsBreakdown(updatedCostsBreakdown);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Fleet management overview and analytics
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.name} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.name}
                  </CardTitle>
                  <div
                    className={`rounded-full p-2.5 ${
                      stat.changeType === "positive"
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                        : stat.changeType === "negative"
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800"
                    }`}
                  >
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : stat.changeType === "negative"
                        ? "text-red-600"
                        : "text-gray-600"
                    } flex items-center mt-1`}>
                    {stat.changeType === "positive" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : stat.changeType === "negative" ? (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    ) : null}
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {financialStats.map((stat) => (
              <Card key={stat.name} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.name}
                  </CardTitle>
                  <div
                    className={`rounded-full p-2.5 ${
                      stat.changeType === "positive"
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                        : stat.changeType === "negative"
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800"
                    }`}
                  >
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : stat.changeType === "negative"
                        ? "text-red-600"
                        : "text-gray-600"
                    } flex items-center mt-1`}>
                    {stat.changeType === "positive" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : stat.changeType === "negative" ? (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    ) : null}
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Fleet Overview
                </CardTitle>
                <CardDescription>
                  Monthly vehicles and maintenance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
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
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Bar dataKey="vehicles" fill="hsl(var(--primary))" name="Total Vehicles" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="maintenance" fill="hsl(var(--destructive))" name="In Maintenance" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Financial Overview
                </CardTitle>
                <CardDescription>
                  Monthly revenue, costs, and profit in USD
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
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
                        labelStyle={{ fontWeight: 'bold' }}
                        formatter={(value) => [`$${value}`, '']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10B981" 
                        name="Revenue"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="costs" 
                        stroke="#EF4444" 
                        name="Costs"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#3B82F6" 
                        name="Profit"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Upcoming Trips
              </CardTitle>
              <CardDescription>
                Scheduled trips for the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-4 p-4 text-sm font-medium bg-muted/50">
                  <div>Client</div>
                  <div>Destination</div>
                  <div>Date & Time</div>
                  <div>Driver</div>
                </div>
                {upcomingTrips.map((trip) => (
                  <div key={trip.id} className="grid grid-cols-4 p-4 text-sm border-t">
                    <div className="font-medium">{trip.client}</div>
                    <div>{trip.destination}</div>
                    <div>{trip.date}</div>
                    <div>{trip.driver}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Fuel className="h-4 w-4 mr-2" />
                Fuel Consumption Trend
              </CardTitle>
              <CardDescription>
                Monthly fuel consumption in liters
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[300px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelConsumptionData}>
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
                      labelStyle={{ fontWeight: 'bold' }}
                      formatter={(value) => [`${value} L`, 'Consumption']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="consumption" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-4 w-4 mr-2" />
                  Fleet Distribution
                </CardTitle>
                <CardDescription>
                  Vehicles by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartPieChart>
                      <Pie
                        data={fleetDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {fleetDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip 
                        formatter={(value) => [`${value} vehicles`, '']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </RechartPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Driver Status
                </CardTitle>
                <CardDescription>
                  Driver availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartPieChart>
                      <Pie
                        data={driverStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {driverStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip 
                        formatter={(value) => [`${value} drivers`, '']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </RechartPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Add new tab for cost breakdown */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Maintenance Costs Summary */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Wrench className="h-5 w-5 mr-2" />
                  Maintenance Costs (USD)
                </CardTitle>
                <CardDescription>
                  Breakdown of vehicle maintenance expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Preventive</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${costsBreakdown.maintenance.preventive.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Repairs</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">${costsBreakdown.maintenance.repairs.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">${costsBreakdown.maintenance.total.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maintenanceCostData}>
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
                      <Bar dataKey="preventive" name="Preventive" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="repairs" name="Repairs" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Fuel Costs Summary */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Fuel className="h-5 w-5 mr-2" />
                  Fuel Costs (USD)
                </CardTitle>
                <CardDescription>
                  Monthly breakdown by fuel type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Diesel</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">${costsBreakdown.fuel.diesel.toLocaleString()}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Petrol</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${costsBreakdown.fuel.petrol.toLocaleString()}</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${costsBreakdown.fuel.total.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fuelCostData}>
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
                      <Bar dataKey="diesel" name="Diesel" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="petrol" name="Petrol" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
