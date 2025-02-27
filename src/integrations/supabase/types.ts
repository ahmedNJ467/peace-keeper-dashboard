export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      drivers: {
        Row: {
          avatar_url: string | null
          contact: string | null
          created_at: string | null
          document_url: string | null
          id: string
          license_expiry: string | null
          license_number: string
          license_type: string | null
          name: string
          status: Database["public"]["Enums"]["driver_status"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          contact?: string | null
          created_at?: string | null
          document_url?: string | null
          id?: string
          license_expiry?: string | null
          license_number: string
          license_type?: string | null
          name: string
          status?: Database["public"]["Enums"]["driver_status"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          contact?: string | null
          created_at?: string | null
          document_url?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string
          license_type?: string | null
          name?: string
          status?: Database["public"]["Enums"]["driver_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      maintenance: {
        Row: {
          cost: number
          created_at: string | null
          date: string
          description: string
          id: string
          next_scheduled: string | null
          notes: string | null
          service_provider: string | null
          status: Database["public"]["Enums"]["maintenance_status"] | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          cost: number
          created_at?: string | null
          date: string
          description: string
          id?: string
          next_scheduled?: string | null
          notes?: string | null
          service_provider?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          next_scheduled?: string | null
          notes?: string | null
          service_provider?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          insurance_expiry: string | null
          make: string
          model: string
          notes: string | null
          registration: string
          status: Database["public"]["Enums"]["vehicle_status"] | null
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          insurance_expiry?: string | null
          make: string
          model: string
          notes?: string | null
          registration: string
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          insurance_expiry?: string | null
          make?: string
          model?: string
          notes?: string | null
          registration?: string
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          type?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      driver_status: "active" | "inactive" | "on_leave"
      maintenance_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      vehicle_status: "active" | "in_service" | "inactive"
      vehicle_type: "armoured" | "soft_skin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
