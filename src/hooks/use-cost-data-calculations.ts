import { 
  CostData,
  MonthlyData,
  VehicleCostData,
  CategoryData,
  YearComparisonData
} from "@/lib/types/cost-analytics";

export function useCostDataCalculations(
  maintenanceData: any[] = [], 
  fuelData: any[] = [],
  comparisonMaintenanceData: any[] = [],
  comparisonFuelData: any[] = [],
  selectedYear: string,
  comparisonYear: string | null
) {
  // Calculate summary data
  const calculateSummaryCosts = (): CostData => {
    const costs: CostData = {
      maintenance: maintenanceData?.reduce((sum, item) => sum + Number(item.cost), 0) || 0,
      fuel: fuelData?.reduce((sum, item) => sum + Number(item.cost), 0) || 0,
      total: 0
    };
    costs.total = costs.maintenance + costs.fuel;
    return costs;
  };
  
  // Calculate monthly data
  const calculateMonthlyData = (): MonthlyData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => ({
      month,
      maintenance: 0,
      fuel: 0,
      total: 0
    }));
    
    if (maintenanceData) {
      maintenanceData.forEach(item => {
        const month = new Date(item.date).getMonth();
        monthlyData[month].maintenance += Number(item.cost);
      });
    }
    
    if (fuelData) {
      fuelData.forEach(item => {
        const month = new Date(item.date).getMonth();
        monthlyData[month].fuel += Number(item.cost);
      });
    }
    
    monthlyData.forEach(item => {
      item.total = item.maintenance + item.fuel;
    });
    
    return monthlyData;
  };

  // Calculate per-vehicle costs
  const calculateVehicleCosts = (): VehicleCostData[] => {
    const vehicleCosts: Record<string, VehicleCostData> = {};
    
    if (maintenanceData) {
      maintenanceData.forEach(item => {
        const vehicleId = item.vehicle_id;
        const vehicleName = item.vehicles ? 
          `${item.vehicles.make} ${item.vehicles.model} (${item.vehicles.registration})` : 
          'Unknown Vehicle';
        
        if (!vehicleCosts[vehicleId]) {
          vehicleCosts[vehicleId] = {
            vehicle_id: vehicleId,
            vehicle_name: vehicleName,
            maintenance: 0,
            fuel: 0,
            total: 0
          };
        }
        
        vehicleCosts[vehicleId].maintenance += Number(item.cost);
      });
    }
    
    if (fuelData) {
      fuelData.forEach(item => {
        const vehicleId = item.vehicle_id;
        const vehicleName = item.vehicles ? 
          `${item.vehicles.make} ${item.vehicles.model} (${item.vehicles.registration})` : 
          'Unknown Vehicle';
        
        if (!vehicleCosts[vehicleId]) {
          vehicleCosts[vehicleId] = {
            vehicle_id: vehicleId,
            vehicle_name: vehicleName,
            maintenance: 0,
            fuel: 0,
            total: 0
          };
        }
        
        vehicleCosts[vehicleId].fuel += Number(item.cost);
      });
    }
    
    return Object.values(vehicleCosts).map(vehicle => {
      vehicle.total = vehicle.maintenance + vehicle.fuel;
      return vehicle;
    }).sort((a, b) => b.total - a.total);
  };

  // Calculate maintenance categories
  const calculateMaintenanceCategories = (): CategoryData[] => {
    const categories: Record<string, number> = {};
    
    if (maintenanceData) {
      maintenanceData.forEach(item => {
        const category = item.description.split(' ')[0] || 'Uncategorized';
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category] += Number(item.cost);
      });
    }
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Calculate fuel types
  const calculateFuelTypes = (): CategoryData[] => {
    const fuelTypes: Record<string, number> = {};
    
    if (fuelData) {
      fuelData.forEach(item => {
        const fuelType = item.fuel_type || 'Other';
        if (!fuelTypes[fuelType]) {
          fuelTypes[fuelType] = 0;
        }
        fuelTypes[fuelType] += Number(item.cost);
      });
    }
    
    return Object.entries(fuelTypes)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Calculate year-over-year comparison data
  const calculateYearComparison = (): YearComparisonData | null => {
    if (!comparisonYear) {
      return null;
    }

    const currentCosts = {
      maintenance: maintenanceData?.reduce((sum, item) => sum + Number(item.cost), 0) || 0,
      fuel: fuelData?.reduce((sum, item) => sum + Number(item.cost), 0) || 0,
      total: 0
    };
    currentCosts.total = currentCosts.maintenance + currentCosts.fuel;

    const previousCosts = {
      maintenance: comparisonMaintenanceData?.reduce((sum, item) => sum + Number(item.cost), 0) || 0,
      fuel: comparisonFuelData?.reduce((sum, item) => sum + Number(item.cost), 0) || 0,
      total: 0
    };
    previousCosts.total = previousCosts.maintenance + previousCosts.fuel;

    const calculatePercentChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      currentYear: selectedYear,
      previousYear: comparisonYear,
      maintenance: {
        current: currentCosts.maintenance,
        previous: previousCosts.maintenance,
        percentChange: calculatePercentChange(currentCosts.maintenance, previousCosts.maintenance)
      },
      fuel: {
        current: currentCosts.fuel,
        previous: previousCosts.fuel,
        percentChange: calculatePercentChange(currentCosts.fuel, previousCosts.fuel)
      },
      total: {
        current: currentCosts.total,
        previous: previousCosts.total,
        percentChange: calculatePercentChange(currentCosts.total, previousCosts.total)
      }
    };
  };

  // Generate all the calculated data at once
  const summaryCosts = calculateSummaryCosts();
  const monthlyData = calculateMonthlyData();
  const vehicleCosts = calculateVehicleCosts();
  const maintenanceCategories = calculateMaintenanceCategories();
  const fuelTypes = calculateFuelTypes();
  const yearComparison = calculateYearComparison();

  return {
    summaryCosts,
    monthlyData,
    vehicleCosts,
    maintenanceCategories,
    fuelTypes,
    yearComparison
  };
}
