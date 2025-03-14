
import { YearComparisonData } from '@/lib/types/cost-analytics';

export function calculateYearComparison(
  maintenanceData: any[] = [],
  fuelData: any[] = [],
  sparePartsData: any[] = [],
  comparisonMaintenanceData: any[] = [],
  comparisonFuelData: any[] = [],
  comparisonSparePartsData: any[] = [],
  selectedYear: string,
  comparisonYear: string | null
): YearComparisonData {
  // Default response structure
  const response: YearComparisonData = {
    currentYear: selectedYear,
    previousYear: comparisonYear || '',
    maintenance: {
      current: 0,
      previous: 0,
      percentChange: 0
    },
    fuel: {
      current: 0,
      previous: 0,
      percentChange: 0
    },
    spareParts: {
      current: 0,
      previous: 0,
      percentChange: 0
    },
    total: {
      current: 0,
      previous: 0,
      percentChange: 0
    }
  };
  
  if (!comparisonYear) {
    return response;
  }
  
  // Ensure we have valid arrays
  const safeMaintenanceData = Array.isArray(maintenanceData) ? maintenanceData : [];
  const safeFuelData = Array.isArray(fuelData) ? fuelData : [];
  const safeSparePartsData = Array.isArray(sparePartsData) ? sparePartsData : [];
  const safeComparisonMaintenanceData = Array.isArray(comparisonMaintenanceData) ? comparisonMaintenanceData : [];
  const safeComparisonFuelData = Array.isArray(comparisonFuelData) ? comparisonFuelData : [];
  const safeComparisonSparePartsData = Array.isArray(comparisonSparePartsData) ? comparisonSparePartsData : [];
  
  // Filter to only include completed maintenance
  const completedMaintenance = safeMaintenanceData.filter(item => item?.status === 'completed');
  const completedComparisonMaintenance = safeComparisonMaintenanceData.filter(item => item?.status === 'completed');
  
  // Calculate current year costs
  response.maintenance.current = completedMaintenance.reduce((sum, item) => sum + Number(item?.cost || 0), 0);
  response.fuel.current = safeFuelData.reduce((sum, item) => sum + Number(item?.cost || 0), 0);
  response.spareParts.current = safeSparePartsData.reduce((sum, item) => {
    const quantityUsed = Number(item?.quantity_used || 0);
    const costPerUnit = Number(item?.cost_per_unit || 0);
    return sum + (quantityUsed * costPerUnit);
  }, 0);
  response.total.current = response.maintenance.current + response.fuel.current + response.spareParts.current;
  
  // Calculate comparison year costs
  response.maintenance.previous = completedComparisonMaintenance.reduce((sum, item) => sum + Number(item?.cost || 0), 0);
  response.fuel.previous = safeComparisonFuelData.reduce((sum, item) => sum + Number(item?.cost || 0), 0);
  response.spareParts.previous = safeComparisonSparePartsData.reduce((sum, item) => {
    const quantityUsed = Number(item?.quantity_used || 0);
    const costPerUnit = Number(item?.cost_per_unit || 0);
    return sum + (quantityUsed * costPerUnit);
  }, 0);
  response.total.previous = response.maintenance.previous + response.fuel.previous + response.spareParts.previous;
  
  // Calculate percent changes
  response.maintenance.percentChange = calculatePercentChange(response.maintenance.previous, response.maintenance.current);
  response.fuel.percentChange = calculatePercentChange(response.fuel.previous, response.fuel.current);
  response.spareParts.percentChange = calculatePercentChange(response.spareParts.previous, response.spareParts.current);
  response.total.percentChange = calculatePercentChange(response.total.previous, response.total.current);
  
  return response;
}

function calculatePercentChange(previous: number, current: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / previous) * 100;
}
