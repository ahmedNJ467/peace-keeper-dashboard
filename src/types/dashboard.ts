
export interface StatCardProps {
  name: string;
  value: string;
  icon: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
}

export interface TripItemProps {
  id: string | number;
  client: string;
  destination: string;
  date: string;
  driver: string;
}

export interface AlertItemProps {
  id: number | string;
  title: string;
  priority: "high" | "medium" | "low";
  date: string;
}

export interface CostsBreakdownProps {
  maintenance: {
    service: number;
    repairs: number;
    total: number;
  };
  fuel: {
    diesel: number;
    petrol: number;
    total: number;
  };
}

export interface ActivityItemProps {
  id: number | string;
  title: string;
  timestamp: string;
  type: "trip" | "maintenance" | "vehicle" | "driver" | "client" | "fuel" | "contract";
  icon: string;
}
