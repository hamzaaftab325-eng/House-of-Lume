export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductType =
  | "lamp"
  | "plant"
  | "planter"
  | "decor"
  | "candle"
  | "mirror"
  | "furniture"
  | "other";

export type ProductStatus = "draft" | "active" | "archived";
export type VariantStatus = "active" | "inactive" | "archived";

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          care_instructions: string | null;
          created_at: string;
          description: string | null;
          id: string;
          material_summary: string | null;
          name: string;
          product_type: ProductType;
          published_at: string | null;
          seo_description: string | null;
          seo_title: string | null;
          short_description: string | null;
          slug: string;
          specifications: Json;
          status: ProductStatus;
          updated_at: string;
        };
        Insert: {
          care_instructions?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          material_summary?: string | null;
          name: string;
          product_type: ProductType;
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          slug: string;
          specifications?: Json;
          status?: ProductStatus;
          updated_at?: string;
        };
        Update: {
          care_instructions?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          material_summary?: string | null;
          name?: string;
          product_type?: ProductType;
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          slug?: string;
          specifications?: Json;
          status?: ProductStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          attributes: Json;
          barcode: string | null;
          compare_at_price_pkr: number | null;
          cost_pkr: number | null;
          created_at: string;
          dimensions_cm: Json;
          id: string;
          price_pkr: number;
          product_id: string;
          sku: string;
          status: VariantStatus;
          title: string;
          track_inventory: boolean;
          updated_at: string;
          weight_grams: number | null;
        };
        Insert: {
          attributes?: Json;
          barcode?: string | null;
          compare_at_price_pkr?: number | null;
          cost_pkr?: number | null;
          created_at?: string;
          dimensions_cm?: Json;
          id?: string;
          price_pkr: number;
          product_id: string;
          sku: string;
          status?: VariantStatus;
          title: string;
          track_inventory?: boolean;
          updated_at?: string;
          weight_grams?: number | null;
        };
        Update: {
          attributes?: Json;
          barcode?: string | null;
          compare_at_price_pkr?: number | null;
          cost_pkr?: number | null;
          created_at?: string;
          dimensions_cm?: Json;
          id?: string;
          price_pkr?: number;
          product_id?: string;
          sku?: string;
          status?: VariantStatus;
          title?: string;
          track_inventory?: boolean;
          updated_at?: string;
          weight_grams?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter_subscribers: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          source: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          source?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          source?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      product_type: ProductType;
      product_status: ProductStatus;
      variant_status: VariantStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
