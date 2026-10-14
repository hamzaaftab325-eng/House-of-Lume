export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          cart_id: string;
          created_at: string;
          customer_id: string | null;
          detected_at: string;
          email: string | null;
          expires_at: string | null;
          id: string;
          notified_at: string | null;
          phone: string | null;
          recovered_at: string | null;
          status: Database["public"]["Enums"]["abandoned_cart_status"];
          updated_at: string;
        };
        Insert: {
          cart_id: string;
          created_at?: string;
          customer_id?: string | null;
          detected_at?: string;
          email?: string | null;
          expires_at?: string | null;
          id?: string;
          notified_at?: string | null;
          phone?: string | null;
          recovered_at?: string | null;
          status?: Database["public"]["Enums"]["abandoned_cart_status"];
          updated_at?: string;
        };
        Update: {
          cart_id?: string;
          created_at?: string;
          customer_id?: string | null;
          detected_at?: string;
          email?: string | null;
          expires_at?: string | null;
          id?: string;
          notified_at?: string | null;
          phone?: string | null;
          recovered_at?: string | null;
          status?: Database["public"]["Enums"]["abandoned_cart_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: true;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "abandoned_carts_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_logs: {
        Row: {
          actor_user_id: string | null;
          created_at: string;
          customer_id: string | null;
          entity_id: string | null;
          entity_type: string | null;
          event_type: string;
          id: number;
          metadata: Json;
        };
        Insert: {
          actor_user_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          event_type: string;
          id?: never;
          metadata?: Json;
        };
        Update: {
          actor_user_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          event_type?: string;
          id?: never;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          after_data: Json | null;
          before_data: Json | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: number;
          ip_address: unknown;
          request_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
          ip_address?: unknown;
          request_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: never;
          ip_address?: unknown;
          request_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          cart_id: string;
          created_at: string;
          id: string;
          quantity: number;
          updated_at: string;
          variant_id: string;
        };
        Insert: {
          cart_id: string;
          created_at?: string;
          id?: string;
          quantity: number;
          updated_at?: string;
          variant_id: string;
        };
        Update: {
          cart_id?: string;
          created_at?: string;
          id?: string;
          quantity?: number;
          updated_at?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      carts: {
        Row: {
          converted_order_id: string | null;
          created_at: string;
          currency: string;
          customer_id: string | null;
          discount_id: string | null;
          expires_at: string | null;
          guest_token_hash: string | null;
          id: string;
          last_activity_at: string;
          status: Database["public"]["Enums"]["cart_status"];
          updated_at: string;
        };
        Insert: {
          converted_order_id?: string | null;
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          discount_id?: string | null;
          expires_at?: string | null;
          guest_token_hash?: string | null;
          id?: string;
          last_activity_at?: string;
          status?: Database["public"]["Enums"]["cart_status"];
          updated_at?: string;
        };
        Update: {
          converted_order_id?: string | null;
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          discount_id?: string | null;
          expires_at?: string | null;
          guest_token_hash?: string | null;
          id?: string;
          last_activity_at?: string;
          status?: Database["public"]["Enums"]["cart_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carts_converted_order_id_fkey";
            columns: ["converted_order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "carts_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "carts_discount_id_fkey";
            columns: ["discount_id"];
            isOneToOne: false;
            referencedRelation: "discounts";
            referencedColumns: ["id"];
          },
        ];
      };
      catalogue_stock_status: {
        Row: {
          in_stock: boolean;
          product_id: string;
          updated_at: string;
        };
        Insert: {
          in_stock?: boolean;
          product_id: string;
          updated_at?: string;
        };
        Update: {
          in_stock?: boolean;
          product_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "catalogue_stock_status_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "catalogue_product_index";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "catalogue_stock_status_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          parent_id: string | null;
          position: number;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          parent_id?: string | null;
          position?: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          parent_id?: string | null;
          position?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      cod_settlements: {
        Row: {
          collected_at: string | null;
          collected_pkr: number | null;
          courier_name: string | null;
          courier_reference: string | null;
          created_at: string;
          discrepancy_note: string | null;
          expected_pkr: number;
          id: string;
          order_id: string;
          received_at: string | null;
          received_pkr: number | null;
          reconciled_at: string | null;
          reconciled_by: string | null;
          shipment_id: string | null;
          status: Database["public"]["Enums"]["cod_settlement_status"];
          updated_at: string;
        };
        Insert: {
          collected_at?: string | null;
          collected_pkr?: number | null;
          courier_name?: string | null;
          courier_reference?: string | null;
          created_at?: string;
          discrepancy_note?: string | null;
          expected_pkr: number;
          id?: string;
          order_id: string;
          received_at?: string | null;
          received_pkr?: number | null;
          reconciled_at?: string | null;
          reconciled_by?: string | null;
          shipment_id?: string | null;
          status?: Database["public"]["Enums"]["cod_settlement_status"];
          updated_at?: string;
        };
        Update: {
          collected_at?: string | null;
          collected_pkr?: number | null;
          courier_name?: string | null;
          courier_reference?: string | null;
          created_at?: string;
          discrepancy_note?: string | null;
          expected_pkr?: number;
          id?: string;
          order_id?: string;
          received_at?: string | null;
          received_pkr?: number | null;
          reconciled_at?: string | null;
          reconciled_by?: string | null;
          shipment_id?: string | null;
          status?: Database["public"]["Enums"]["cod_settlement_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cod_settlements_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cod_settlements_shipment_fk";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
      cod_verifications: {
        Row: {
          attempt_number: number;
          contact_channel: string | null;
          contact_outcome: string | null;
          created_at: string;
          id: string;
          initiated_by: string | null;
          method: Database["public"]["Enums"]["verification_method"];
          note: string | null;
          order_id: string;
          provider_message_id: string | null;
          responded_at: string | null;
          sent_at: string | null;
          staff_action: string | null;
          status: Database["public"]["Enums"]["verification_status"];
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          attempt_number: number;
          contact_channel?: string | null;
          contact_outcome?: string | null;
          created_at?: string;
          id?: string;
          initiated_by?: string | null;
          method: Database["public"]["Enums"]["verification_method"];
          note?: string | null;
          order_id: string;
          provider_message_id?: string | null;
          responded_at?: string | null;
          sent_at?: string | null;
          staff_action?: string | null;
          status?: Database["public"]["Enums"]["verification_status"];
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          attempt_number?: number;
          contact_channel?: string | null;
          contact_outcome?: string | null;
          created_at?: string;
          id?: string;
          initiated_by?: string | null;
          method?: Database["public"]["Enums"]["verification_method"];
          note?: string | null;
          order_id?: string;
          provider_message_id?: string | null;
          responded_at?: string | null;
          sent_at?: string | null;
          staff_action?: string | null;
          status?: Database["public"]["Enums"]["verification_status"];
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cod_verifications_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      collection_products: {
        Row: {
          collection_id: string;
          created_at: string;
          position: number;
          product_id: string;
        };
        Insert: {
          collection_id: string;
          created_at?: string;
          position?: number;
          product_id: string;
        };
        Update: {
          collection_id?: string;
          created_at?: string;
          position?: number;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalogue_product_index";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      collections: {
        Row: {
          created_at: string;
          description: string | null;
          ends_at: string | null;
          id: string;
          is_active: boolean;
          name: string;
          position: number;
          slug: string;
          starts_at: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          position?: number;
          slug: string;
          starts_at?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          position?: number;
          slug?: string;
          starts_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      commerce_import_receipts: {
        Row: {
          created_at: string;
          guest_token_hash: string;
          import_id: string;
        };
        Insert: {
          created_at?: string;
          guest_token_hash: string;
          import_id: string;
        };
        Update: {
          created_at?: string;
          guest_token_hash?: string;
          import_id?: string;
        };
        Relationships: [];
      };
      customer_addresses: {
        Row: {
          address_line1: string;
          address_line2: string | null;
          city: string;
          country_code: string;
          created_at: string;
          customer_id: string;
          district: string | null;
          id: string;
          is_default: boolean;
          label: string | null;
          phone: string;
          postal_code: string | null;
          province: string;
          recipient_name: string;
          updated_at: string;
          whatsapp_number: string | null;
        };
        Insert: {
          address_line1: string;
          address_line2?: string | null;
          city: string;
          country_code?: string;
          created_at?: string;
          customer_id: string;
          district?: string | null;
          id?: string;
          is_default?: boolean;
          label?: string | null;
          phone: string;
          postal_code?: string | null;
          province: string;
          recipient_name: string;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Update: {
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          country_code?: string;
          created_at?: string;
          customer_id?: string;
          district?: string | null;
          id?: string;
          is_default?: boolean;
          label?: string | null;
          phone?: string;
          postal_code?: string | null;
          province?: string;
          recipient_name?: string;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          created_at: string;
          email: string | null;
          first_order_at: string | null;
          full_name: string | null;
          id: string;
          last_order_at: string | null;
          marketing_email_opt_in: boolean;
          marketing_whatsapp_opt_in: boolean;
          phone: string | null;
          status: Database["public"]["Enums"]["customer_status"];
          updated_at: string;
          user_id: string | null;
          whatsapp_number: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          first_order_at?: string | null;
          full_name?: string | null;
          id?: string;
          last_order_at?: string | null;
          marketing_email_opt_in?: boolean;
          marketing_whatsapp_opt_in?: boolean;
          phone?: string | null;
          status?: Database["public"]["Enums"]["customer_status"];
          updated_at?: string;
          user_id?: string | null;
          whatsapp_number?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          first_order_at?: string | null;
          full_name?: string | null;
          id?: string;
          last_order_at?: string | null;
          marketing_email_opt_in?: boolean;
          marketing_whatsapp_opt_in?: boolean;
          phone?: string | null;
          status?: Database["public"]["Enums"]["customer_status"];
          updated_at?: string;
          user_id?: string | null;
          whatsapp_number?: string | null;
        };
        Relationships: [];
      };
      delivery_attempts: {
        Row: {
          attempt_number: number;
          attempted_at: string;
          created_at: string;
          id: string;
          next_attempt_at: string | null;
          reason_code: string | null;
          reason_detail: string | null;
          recorded_by: string | null;
          shipment_id: string;
          status: Database["public"]["Enums"]["delivery_attempt_status"];
        };
        Insert: {
          attempt_number: number;
          attempted_at: string;
          created_at?: string;
          id?: string;
          next_attempt_at?: string | null;
          reason_code?: string | null;
          reason_detail?: string | null;
          recorded_by?: string | null;
          shipment_id: string;
          status: Database["public"]["Enums"]["delivery_attempt_status"];
        };
        Update: {
          attempt_number?: number;
          attempted_at?: string;
          created_at?: string;
          id?: string;
          next_attempt_at?: string | null;
          reason_code?: string | null;
          reason_detail?: string | null;
          recorded_by?: string | null;
          shipment_id?: string;
          status?: Database["public"]["Enums"]["delivery_attempt_status"];
        };
        Relationships: [
          {
            foreignKeyName: "delivery_attempts_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
      discount_redemptions: {
        Row: {
          amount_pkr: number;
          created_at: string;
          customer_id: string | null;
          discount_id: string;
          id: string;
          order_id: string;
        };
        Insert: {
          amount_pkr: number;
          created_at?: string;
          customer_id?: string | null;
          discount_id: string;
          id?: string;
          order_id: string;
        };
        Update: {
          amount_pkr?: number;
          created_at?: string;
          customer_id?: string | null;
          discount_id?: string;
          id?: string;
          order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discount_redemptions_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discount_redemptions_discount_id_fkey";
            columns: ["discount_id"];
            isOneToOne: false;
            referencedRelation: "discounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discount_redemptions_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      discount_rules: {
        Row: {
          created_at: string;
          discount_id: string;
          id: string;
          rule_config: Json;
          rule_type: string;
        };
        Insert: {
          created_at?: string;
          discount_id: string;
          id?: string;
          rule_config?: Json;
          rule_type: string;
        };
        Update: {
          created_at?: string;
          discount_id?: string;
          id?: string;
          rule_config?: Json;
          rule_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discount_rules_discount_id_fkey";
            columns: ["discount_id"];
            isOneToOne: false;
            referencedRelation: "discounts";
            referencedColumns: ["id"];
          },
        ];
      };
      discounts: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          discount_type: Database["public"]["Enums"]["discount_type"];
          ends_at: string | null;
          fixed_amount_pkr: number | null;
          id: string;
          is_active: boolean;
          max_discount_pkr: number | null;
          min_order_pkr: number;
          name: string;
          percentage_bps: number | null;
          starts_at: string | null;
          updated_at: string;
          usage_limit: number | null;
          usage_limit_per_customer: number | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          discount_type: Database["public"]["Enums"]["discount_type"];
          ends_at?: string | null;
          fixed_amount_pkr?: number | null;
          id?: string;
          is_active?: boolean;
          max_discount_pkr?: number | null;
          min_order_pkr?: number;
          name: string;
          percentage_bps?: number | null;
          starts_at?: string | null;
          updated_at?: string;
          usage_limit?: number | null;
          usage_limit_per_customer?: number | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          discount_type?: Database["public"]["Enums"]["discount_type"];
          ends_at?: string | null;
          fixed_amount_pkr?: number | null;
          id?: string;
          is_active?: boolean;
          max_discount_pkr?: number | null;
          min_order_pkr?: number;
          name?: string;
          percentage_bps?: number | null;
          starts_at?: string | null;
          updated_at?: string;
          usage_limit?: number | null;
          usage_limit_per_customer?: number | null;
        };
        Relationships: [];
      };
      email_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          notification_delivery_id: string | null;
          occurred_at: string;
          payload: Json;
          provider: string;
          provider_event_id: string | null;
          recipient_email: string | null;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          notification_delivery_id?: string | null;
          occurred_at: string;
          payload?: Json;
          provider: string;
          provider_event_id?: string | null;
          recipient_email?: string | null;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          notification_delivery_id?: string | null;
          occurred_at?: string;
          payload?: Json;
          provider?: string;
          provider_event_id?: string | null;
          recipient_email?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "email_events_notification_delivery_id_fkey";
            columns: ["notification_delivery_id"];
            isOneToOne: false;
            referencedRelation: "notification_deliveries";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_balances: {
        Row: {
          available: number | null;
          location_id: string;
          low_stock_threshold: number;
          on_hand: number;
          reserved: number;
          updated_at: string;
          variant_id: string;
        };
        Insert: {
          available?: number | null;
          location_id: string;
          low_stock_threshold?: number;
          on_hand?: number;
          reserved?: number;
          updated_at?: string;
          variant_id: string;
        };
        Update: {
          available?: number | null;
          location_id?: string;
          low_stock_threshold?: number;
          on_hand?: number;
          reserved?: number;
          updated_at?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_balances_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "inventory_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_balances_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_ledger: {
        Row: {
          actor_user_id: string | null;
          balance_on_hand: number;
          balance_reserved: number;
          created_at: string;
          delta_on_hand: number;
          delta_reserved: number;
          event_type: Database["public"]["Enums"]["inventory_event_type"];
          id: number;
          location_id: string;
          note: string | null;
          reference_id: string | null;
          reference_type: string | null;
          variant_id: string;
        };
        Insert: {
          actor_user_id?: string | null;
          balance_on_hand: number;
          balance_reserved: number;
          created_at?: string;
          delta_on_hand?: number;
          delta_reserved?: number;
          event_type: Database["public"]["Enums"]["inventory_event_type"];
          id?: never;
          location_id: string;
          note?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          variant_id: string;
        };
        Update: {
          actor_user_id?: string | null;
          balance_on_hand?: number;
          balance_reserved?: number;
          created_at?: string;
          delta_on_hand?: number;
          delta_reserved?: number;
          event_type?: Database["public"]["Enums"]["inventory_event_type"];
          id?: never;
          location_id?: string;
          note?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_ledger_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "inventory_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_ledger_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_locations: {
        Row: {
          city: string | null;
          code: string;
          country_code: string;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          province: string | null;
          updated_at: string;
        };
        Insert: {
          city?: string | null;
          code: string;
          country_code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          province?: string | null;
          updated_at?: string;
        };
        Update: {
          city?: string | null;
          code?: string;
          country_code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          province?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventory_reservations: {
        Row: {
          cart_id: string;
          cart_item_id: string;
          created_at: string;
          expires_at: string;
          id: string;
          location_id: string;
          quantity: number;
          release_reason: string | null;
          released_at: string | null;
          status: string;
          updated_at: string;
          variant_id: string;
        };
        Insert: {
          cart_id: string;
          cart_item_id: string;
          created_at?: string;
          expires_at: string;
          id?: string;
          location_id: string;
          quantity: number;
          release_reason?: string | null;
          released_at?: string | null;
          status?: string;
          updated_at?: string;
          variant_id: string;
        };
        Update: {
          cart_id?: string;
          cart_item_id?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          location_id?: string;
          quantity?: number;
          release_reason?: string | null;
          released_at?: string | null;
          status?: string;
          updated_at?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_reservations_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_reservations_cart_item_id_fkey";
            columns: ["cart_item_id"];
            isOneToOne: false;
            referencedRelation: "cart_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_reservations_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "inventory_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_reservations_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_deliveries: {
        Row: {
          attempt_count: number;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          delivered_at: string | null;
          failed_at: string | null;
          id: string;
          last_error_code: string | null;
          last_error_message: string | null;
          notification_id: string;
          provider: string | null;
          provider_message_id: string | null;
          queued_at: string;
          sent_at: string | null;
          status: Database["public"]["Enums"]["notification_delivery_status"];
          updated_at: string;
        };
        Insert: {
          attempt_count?: number;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          delivered_at?: string | null;
          failed_at?: string | null;
          id?: string;
          last_error_code?: string | null;
          last_error_message?: string | null;
          notification_id: string;
          provider?: string | null;
          provider_message_id?: string | null;
          queued_at?: string;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_delivery_status"];
          updated_at?: string;
        };
        Update: {
          attempt_count?: number;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          delivered_at?: string | null;
          failed_at?: string | null;
          id?: string;
          last_error_code?: string | null;
          last_error_message?: string | null;
          notification_id?: string;
          provider?: string | null;
          provider_message_id?: string | null;
          queued_at?: string;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_delivery_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey";
            columns: ["notification_id"];
            isOneToOne: false;
            referencedRelation: "notifications";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          created_at: string;
          customer_id: string;
          email_marketing: boolean;
          email_order_updates: boolean;
          in_app_order_updates: boolean;
          updated_at: string;
          whatsapp_marketing: boolean;
          whatsapp_order_updates: boolean;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          email_marketing?: boolean;
          email_order_updates?: boolean;
          in_app_order_updates?: boolean;
          updated_at?: string;
          whatsapp_marketing?: boolean;
          whatsapp_order_updates?: boolean;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          email_marketing?: boolean;
          email_order_updates?: boolean;
          in_app_order_updates?: boolean;
          updated_at?: string;
          whatsapp_marketing?: boolean;
          whatsapp_order_updates?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: true;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          data: Json;
          entity_id: string | null;
          entity_type: string | null;
          event_key: string;
          id: string;
          priority: Database["public"]["Enums"]["notification_priority"];
          read_at: string | null;
          recipient_customer_id: string | null;
          recipient_user_id: string | null;
          title: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          data?: Json;
          entity_id?: string | null;
          entity_type?: string | null;
          event_key: string;
          id?: string;
          priority?: Database["public"]["Enums"]["notification_priority"];
          read_at?: string | null;
          recipient_customer_id?: string | null;
          recipient_user_id?: string | null;
          title: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          data?: Json;
          entity_id?: string | null;
          entity_type?: string | null;
          event_key?: string;
          id?: string;
          priority?: Database["public"]["Enums"]["notification_priority"];
          read_at?: string | null;
          recipient_customer_id?: string | null;
          recipient_user_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_customer_id_fkey";
            columns: ["recipient_customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      order_addresses: {
        Row: {
          address_line1: string;
          address_line2: string | null;
          address_type: Database["public"]["Enums"]["address_type"];
          city: string;
          country_code: string;
          created_at: string;
          delivery_instructions: string | null;
          district: string | null;
          id: string;
          order_id: string;
          phone: string;
          postal_code: string | null;
          province: string;
          recipient_name: string;
          whatsapp_number: string | null;
        };
        Insert: {
          address_line1: string;
          address_line2?: string | null;
          address_type?: Database["public"]["Enums"]["address_type"];
          city: string;
          country_code?: string;
          created_at?: string;
          delivery_instructions?: string | null;
          district?: string | null;
          id?: string;
          order_id: string;
          phone: string;
          postal_code?: string | null;
          province: string;
          recipient_name: string;
          whatsapp_number?: string | null;
        };
        Update: {
          address_line1?: string;
          address_line2?: string | null;
          address_type?: Database["public"]["Enums"]["address_type"];
          city?: string;
          country_code?: string;
          created_at?: string;
          delivery_instructions?: string | null;
          district?: string | null;
          id?: string;
          order_id?: string;
          phone?: string;
          postal_code?: string | null;
          province?: string;
          recipient_name?: string;
          whatsapp_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_addresses_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_inventory_reservations: {
        Row: {
          created_at: string;
          id: string;
          location_id: string;
          order_id: string;
          order_item_id: string;
          quantity: number;
          released_at: string | null;
          source_cart_reservation_id: string;
          status: string;
          variant_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          location_id: string;
          order_id: string;
          order_item_id: string;
          quantity: number;
          released_at?: string | null;
          source_cart_reservation_id: string;
          status?: string;
          variant_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          location_id?: string;
          order_id?: string;
          order_item_id?: string;
          quantity?: number;
          released_at?: string | null;
          source_cart_reservation_id?: string;
          status?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_inventory_reservations_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "inventory_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_inventory_reservations_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_inventory_reservations_order_item_id_fkey";
            columns: ["order_item_id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_inventory_reservations_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          line_total_pkr: number;
          order_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          sku: string;
          unit_price_pkr: number;
          variant_id: string | null;
          variant_name: string;
          variant_snapshot: Json;
        };
        Insert: {
          created_at?: string;
          id?: string;
          line_total_pkr: number;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          quantity: number;
          sku: string;
          unit_price_pkr: number;
          variant_id?: string | null;
          variant_name: string;
          variant_snapshot?: Json;
        };
        Update: {
          created_at?: string;
          id?: string;
          line_total_pkr?: number;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          sku?: string;
          unit_price_pkr?: number;
          variant_id?: string | null;
          variant_name?: string;
          variant_snapshot?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalogue_product_index";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string;
          from_status: Database["public"]["Enums"]["order_status"] | null;
          id: number;
          note: string | null;
          order_id: string;
          to_status: Database["public"]["Enums"]["order_status"];
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          id?: never;
          note?: string | null;
          order_id: string;
          to_status: Database["public"]["Enums"]["order_status"];
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          id?: never;
          note?: string | null;
          order_id?: string;
          to_status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          cancelled_at: string | null;
          cod_settlement_status: Database["public"]["Enums"]["cod_settlement_status"];
          confirmed_at: string | null;
          contact_email: string | null;
          contact_name: string;
          contact_phone: string;
          contact_whatsapp: string | null;
          created_at: string;
          currency: string;
          customer_id: string | null;
          customer_note: string | null;
          delivered_at: string | null;
          discount_id: string | null;
          discount_pkr: number;
          guest_checkout: boolean;
          id: string;
          idempotency_key: string;
          internal_note: string | null;
          order_number: number;
          placed_at: string;
          review_flags: Json;
          review_note: string | null;
          review_status: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          shipping_pkr: number;
          shipping_rule_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          subtotal_pkr: number;
          tax_pkr: number;
          total_pkr: number;
          updated_at: string;
          verification_revision: number;
          verification_status: Database["public"]["Enums"]["verification_status"];
        };
        Insert: {
          cancelled_at?: string | null;
          cod_settlement_status?: Database["public"]["Enums"]["cod_settlement_status"];
          confirmed_at?: string | null;
          contact_email?: string | null;
          contact_name: string;
          contact_phone: string;
          contact_whatsapp?: string | null;
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          customer_note?: string | null;
          delivered_at?: string | null;
          discount_id?: string | null;
          discount_pkr?: number;
          guest_checkout?: boolean;
          id?: string;
          idempotency_key: string;
          internal_note?: string | null;
          order_number?: number;
          placed_at?: string;
          review_flags?: Json;
          review_note?: string | null;
          review_status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          shipping_pkr?: number;
          shipping_rule_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_pkr: number;
          tax_pkr?: number;
          total_pkr: number;
          updated_at?: string;
          verification_revision?: number;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Update: {
          cancelled_at?: string | null;
          cod_settlement_status?: Database["public"]["Enums"]["cod_settlement_status"];
          confirmed_at?: string | null;
          contact_email?: string | null;
          contact_name?: string;
          contact_phone?: string;
          contact_whatsapp?: string | null;
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          customer_note?: string | null;
          delivered_at?: string | null;
          discount_id?: string | null;
          discount_pkr?: number;
          guest_checkout?: boolean;
          id?: string;
          idempotency_key?: string;
          internal_note?: string | null;
          order_number?: number;
          placed_at?: string;
          review_flags?: Json;
          review_note?: string | null;
          review_status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          shipping_pkr?: number;
          shipping_rule_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_pkr?: number;
          tax_pkr?: number;
          total_pkr?: number;
          updated_at?: string;
          verification_revision?: number;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_discount_id_fkey";
            columns: ["discount_id"];
            isOneToOne: false;
            referencedRelation: "discounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_shipping_rule_id_fkey";
            columns: ["shipping_rule_id"];
            isOneToOne: false;
            referencedRelation: "shipping_rules";
            referencedColumns: ["id"];
          },
        ];
      };
      permissions: {
        Row: {
          created_at: string;
          description: string | null;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      product_categories: {
        Row: {
          category_id: string;
          created_at: string;
          is_primary: boolean;
          product_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          is_primary?: boolean;
          product_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          is_primary?: boolean;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_categories_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalogue_product_index";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_categories_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_media: {
        Row: {
          alt_text: string | null;
          created_at: string;
          height: number | null;
          id: string;
          is_primary: boolean;
          media_type: string;
          position: number;
          product_id: string;
          storage_path: string;
          updated_at: string;
          variant_id: string | null;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          is_primary?: boolean;
          media_type?: string;
          position?: number;
          product_id: string;
          storage_path: string;
          updated_at?: string;
          variant_id?: string | null;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          is_primary?: boolean;
          media_type?: string;
          position?: number;
          product_id?: string;
          storage_path?: string;
          updated_at?: string;
          variant_id?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalogue_product_index";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_media_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_media_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      product_option_values: {
        Row: {
          created_at: string;
          id: string;
          metadata: Json;
          option_id: string;
          position: number;
          swatch_hex: string | null;
          value: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          metadata?: Json;
          option_id: string;
          position?: number;
          swatch_hex?: string | null;
          value: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          metadata?: Json;
          option_id?: string;
          position?: number;
          swatch_hex?: string | null;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "product_options";
            referencedColumns: ["id"];
          },
        ];
      };
      product_options: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          position: number;
          product_id: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          position?: number;
          product_id: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          position?: number;
          product_id?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalogue_product_index";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_options_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variant_stock_status: {
        Row: {
          available_quantity: number | null;
          in_stock: boolean;
          low_stock: boolean;
          product_id: string;
          updated_at: string;
          variant_id: string;
        };
        Insert: {
          available_quantity?: number | null;
          in_stock?: boolean;
          low_stock?: boolean;
          product_id: string;
          updated_at?: string;
          variant_id: string;
        };
        Update: {
          available_quantity?: number | null;
          in_stock?: boolean;
          low_stock?: boolean;
          product_id?: string;
          updated_at?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variant_stock_status_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalogue_product_index";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variant_stock_status_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variant_stock_status_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: true;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
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
          status: Database["public"]["Enums"]["variant_status"];
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
          status?: Database["public"]["Enums"]["variant_status"];
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
          status?: Database["public"]["Enums"]["variant_status"];
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
            referencedRelation: "catalogue_product_index";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          care_instructions: string | null;
          created_at: string;
          description: string | null;
          id: string;
          material_summary: string | null;
          name: string;
          product_type: Database["public"]["Enums"]["product_type"];
          published_at: string | null;
          seo_description: string | null;
          seo_title: string | null;
          short_description: string | null;
          slug: string;
          specifications: Json;
          status: Database["public"]["Enums"]["product_status"];
          updated_at: string;
        };
        Insert: {
          care_instructions?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          material_summary?: string | null;
          name: string;
          product_type: Database["public"]["Enums"]["product_type"];
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          slug: string;
          specifications?: Json;
          status?: Database["public"]["Enums"]["product_status"];
          updated_at?: string;
        };
        Update: {
          care_instructions?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          material_summary?: string | null;
          name?: string;
          product_type?: Database["public"]["Enums"]["product_type"];
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          slug?: string;
          specifications?: Json;
          status?: Database["public"]["Enums"]["product_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
          whatsapp_number: string | null;
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Update: {
          avatar_path?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Relationships: [];
      };
      return_items: {
        Row: {
          created_at: string;
          id: string;
          item_condition: string | null;
          order_item_id: string;
          quantity: number;
          resolution: Database["public"]["Enums"]["return_resolution"] | null;
          return_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_condition?: string | null;
          order_item_id: string;
          quantity: number;
          resolution?: Database["public"]["Enums"]["return_resolution"] | null;
          return_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_condition?: string | null;
          order_item_id?: string;
          quantity?: number;
          resolution?: Database["public"]["Enums"]["return_resolution"] | null;
          return_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "return_items_order_item_id_fkey";
            columns: ["order_item_id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "return_items_return_id_fkey";
            columns: ["return_id"];
            isOneToOne: false;
            referencedRelation: "returns";
            referencedColumns: ["id"];
          },
        ];
      };
      returns: {
        Row: {
          approved_at: string | null;
          completed_at: string | null;
          created_at: string;
          customer_id: string | null;
          handled_by: string | null;
          id: string;
          order_id: string;
          reason_code: string;
          reason_detail: string | null;
          received_at: string | null;
          request_hash: string | null;
          request_id: string | null;
          requested_at: string;
          resolution: Database["public"]["Enums"]["return_resolution"] | null;
          return_number: number;
          status: Database["public"]["Enums"]["return_status"];
          updated_at: string;
        };
        Insert: {
          approved_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          customer_id?: string | null;
          handled_by?: string | null;
          id?: string;
          order_id: string;
          reason_code: string;
          reason_detail?: string | null;
          received_at?: string | null;
          request_hash?: string | null;
          request_id?: string | null;
          requested_at?: string;
          resolution?: Database["public"]["Enums"]["return_resolution"] | null;
          return_number?: number;
          status?: Database["public"]["Enums"]["return_status"];
          updated_at?: string;
        };
        Update: {
          approved_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          customer_id?: string | null;
          handled_by?: string | null;
          id?: string;
          order_id?: string;
          reason_code?: string;
          reason_detail?: string | null;
          received_at?: string | null;
          request_hash?: string | null;
          request_id?: string | null;
          requested_at?: string;
          resolution?: Database["public"]["Enums"]["return_resolution"] | null;
          return_number?: number;
          status?: Database["public"]["Enums"]["return_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "returns_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "returns_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          body: string | null;
          created_at: string;
          customer_id: string | null;
          id: string;
          order_item_id: string | null;
          product_id: string;
          published_at: string | null;
          rating: number;
          status: Database["public"]["Enums"]["review_status"];
          title: string | null;
          updated_at: string;
          verified_purchase: boolean;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          order_item_id?: string | null;
          product_id: string;
          published_at?: string | null;
          rating: number;
          status?: Database["public"]["Enums"]["review_status"];
          title?: string | null;
          updated_at?: string;
          verified_purchase?: boolean;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          order_item_id?: string | null;
          product_id?: string;
          published_at?: string | null;
          rating?: number;
          status?: Database["public"]["Enums"]["review_status"];
          title?: string | null;
          updated_at?: string;
          verified_purchase?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_order_item_id_fkey";
            columns: ["order_item_id"];
            isOneToOne: true;
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalogue_product_index";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          created_at: string;
          permission_slug: string;
          role_slug: string;
        };
        Insert: {
          created_at?: string;
          permission_slug: string;
          role_slug: string;
        };
        Update: {
          created_at?: string;
          permission_slug?: string;
          role_slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_slug_fkey";
            columns: ["permission_slug"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "role_permissions_role_slug_fkey";
            columns: ["role_slug"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["slug"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string;
          description: string | null;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      rto_records: {
        Row: {
          created_at: string;
          id: string;
          initiated_at: string;
          order_id: string;
          reason_code: string | null;
          reason_detail: string | null;
          received_at: string | null;
          resolution_note: string | null;
          resolved_at: string | null;
          shipment_id: string | null;
          status: Database["public"]["Enums"]["rto_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          initiated_at?: string;
          order_id: string;
          reason_code?: string | null;
          reason_detail?: string | null;
          received_at?: string | null;
          resolution_note?: string | null;
          resolved_at?: string | null;
          shipment_id?: string | null;
          status?: Database["public"]["Enums"]["rto_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          initiated_at?: string;
          order_id?: string;
          reason_code?: string | null;
          reason_detail?: string | null;
          received_at?: string | null;
          resolution_note?: string | null;
          resolved_at?: string | null;
          shipment_id?: string | null;
          status?: Database["public"]["Enums"]["rto_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rto_records_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rto_records_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
      shipments: {
        Row: {
          courier_name: string | null;
          courier_service: string | null;
          created_at: string;
          delivered_at: string | null;
          expected_delivery_at: string | null;
          id: string;
          order_id: string;
          shipped_at: string | null;
          status: Database["public"]["Enums"]["shipment_status"];
          tracking_number: string | null;
          updated_at: string;
        };
        Insert: {
          courier_name?: string | null;
          courier_service?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          expected_delivery_at?: string | null;
          id?: string;
          order_id: string;
          shipped_at?: string | null;
          status?: Database["public"]["Enums"]["shipment_status"];
          tracking_number?: string | null;
          updated_at?: string;
        };
        Update: {
          courier_name?: string | null;
          courier_service?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          expected_delivery_at?: string | null;
          id?: string;
          order_id?: string;
          shipped_at?: string | null;
          status?: Database["public"]["Enums"]["shipment_status"];
          tracking_number?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      shipping_rules: {
        Row: {
          cod_max_order_pkr: number | null;
          cod_min_order_pkr: number;
          created_at: string;
          ends_at: string | null;
          estimated_days_max: number;
          estimated_days_min: number;
          flat_fee_pkr: number;
          free_shipping_threshold_pkr: number | null;
          id: string;
          is_active: boolean;
          name: string;
          remote_surcharge_pkr: number;
          starts_at: string | null;
          updated_at: string;
          zone_id: string;
        };
        Insert: {
          cod_max_order_pkr?: number | null;
          cod_min_order_pkr?: number;
          created_at?: string;
          ends_at?: string | null;
          estimated_days_max?: number;
          estimated_days_min?: number;
          flat_fee_pkr?: number;
          free_shipping_threshold_pkr?: number | null;
          id?: string;
          is_active?: boolean;
          name: string;
          remote_surcharge_pkr?: number;
          starts_at?: string | null;
          updated_at?: string;
          zone_id: string;
        };
        Update: {
          cod_max_order_pkr?: number | null;
          cod_min_order_pkr?: number;
          created_at?: string;
          ends_at?: string | null;
          estimated_days_max?: number;
          estimated_days_min?: number;
          flat_fee_pkr?: number;
          free_shipping_threshold_pkr?: number | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          remote_surcharge_pkr?: number;
          starts_at?: string | null;
          updated_at?: string;
          zone_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipping_rules_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "shipping_zones";
            referencedColumns: ["id"];
          },
        ];
      };
      shipping_zones: {
        Row: {
          cities: string[];
          code: string;
          country_code: string;
          created_at: string;
          id: string;
          is_active: boolean;
          is_nationwide: boolean;
          name: string;
          provinces: string[];
          updated_at: string;
        };
        Insert: {
          cities?: string[];
          code: string;
          country_code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_nationwide?: boolean;
          name: string;
          provinces?: string[];
          updated_at?: string;
        };
        Update: {
          cities?: string[];
          code?: string;
          country_code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_nationwide?: boolean;
          name?: string;
          provinces?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_profiles: {
        Row: {
          created_at: string;
          is_active: boolean;
          role_slug: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          is_active?: boolean;
          role_slug: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          is_active?: boolean;
          role_slug?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_profiles_role_slug_fkey";
            columns: ["role_slug"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "staff_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      support_messages: {
        Row: {
          author_customer_id: string | null;
          author_user_id: string | null;
          body: string;
          created_at: string;
          id: string;
          is_internal: boolean;
          ticket_id: string;
        };
        Insert: {
          author_customer_id?: string | null;
          author_user_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          is_internal?: boolean;
          ticket_id: string;
        };
        Update: {
          author_customer_id?: string | null;
          author_user_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          is_internal?: boolean;
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_messages_author_customer_id_fkey";
            columns: ["author_customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "support_tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      support_tickets: {
        Row: {
          assigned_to: string | null;
          created_at: string;
          customer_id: string | null;
          id: string;
          order_id: string | null;
          priority: Database["public"]["Enums"]["notification_priority"];
          resolved_at: string | null;
          status: Database["public"]["Enums"]["support_status"];
          subject: string;
          ticket_number: number;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          order_id?: string | null;
          priority?: Database["public"]["Enums"]["notification_priority"];
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["support_status"];
          subject: string;
          ticket_number?: number;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          order_id?: string | null;
          priority?: Database["public"]["Enums"]["notification_priority"];
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["support_status"];
          subject?: string;
          ticket_number?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_tickets_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "support_tickets_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      system_settings: {
        Row: {
          created_at: string;
          description: string | null;
          is_public: boolean;
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          is_public?: boolean;
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value: Json;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          is_public?: boolean;
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      variant_option_values: {
        Row: {
          created_at: string;
          option_value_id: string;
          variant_id: string;
        };
        Insert: {
          created_at?: string;
          option_value_id: string;
          variant_id: string;
        };
        Update: {
          created_at?: string;
          option_value_id?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "variant_option_values_option_value_id_fkey";
            columns: ["option_value_id"];
            isOneToOne: false;
            referencedRelation: "product_option_values";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "variant_option_values_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      wishlist_items: {
        Row: {
          created_at: string;
          variant_id: string;
          wishlist_id: string;
        };
        Insert: {
          created_at?: string;
          variant_id: string;
          wishlist_id: string;
        };
        Update: {
          created_at?: string;
          variant_id?: string;
          wishlist_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey";
            columns: ["wishlist_id"];
            isOneToOne: false;
            referencedRelation: "wishlists";
            referencedColumns: ["id"];
          },
        ];
      };
      wishlists: {
        Row: {
          created_at: string;
          customer_id: string;
          id: string;
          is_default: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          id?: string;
          is_default?: boolean;
          name?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          id?: string;
          is_default?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlists_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      catalogue_product_index: {
        Row: {
          category_slugs: string[] | null;
          collection_position: number | null;
          collection_slugs: string[] | null;
          colors: string[] | null;
          id: string | null;
          in_stock: boolean | null;
          material_summary: string | null;
          materials: string[] | null;
          max_price_pkr: number | null;
          min_price_pkr: number | null;
          name: string | null;
          primary_category_slug: string | null;
          primary_media_alt: string | null;
          primary_media_path: string | null;
          product_type: string | null;
          published_at: string | null;
          short_description: string | null;
          slug: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      account_delete_address: { Args: { p_id: string }; Returns: undefined };
      account_request_return: {
        Args: {
          p_detail: string;
          p_items: Json;
          p_order_id: string;
          p_reason: string;
          p_request_id: string;
        };
        Returns: string;
      };
      account_save_address: { Args: { p_values: Json }; Returns: string };
      account_save_preferences: {
        Args: { p_email_marketing: boolean };
        Returns: undefined;
      };
      account_save_profile: {
        Args: { p_name: string; p_phone: string; p_whatsapp: string };
        Returns: undefined;
      };
      account_session_valid: { Args: never; Returns: boolean };
      catalogue_facets: {
        Args: { p_category?: string; p_collection?: string };
        Returns: Json;
      };
      catalogue_products: {
        Args: {
          p_availability?: string;
          p_category?: string;
          p_collection?: string;
          p_color?: string;
          p_limit?: number;
          p_material?: string;
          p_max_price?: number;
          p_min_price?: number;
          p_offset?: number;
          p_search?: string;
          p_sort?: string;
        };
        Returns: {
          category_slugs: string[];
          collection_slugs: string[];
          colors: string[];
          id: string;
          in_stock: boolean;
          material_summary: string;
          materials: string[];
          max_price_pkr: number;
          min_price_pkr: number;
          name: string;
          primary_category_slug: string;
          primary_media_alt: string;
          primary_media_path: string;
          product_type: string;
          published_at: string;
          short_description: string;
          slug: string;
          total_count: number;
        }[];
      };
      checkout_apply_discount: {
        Args: { p_address: Json; p_code: string; p_guest_hash: string };
        Returns: Json;
      };
      checkout_confirmation: {
        Args: { p_guest_hash: string; p_order_id: string };
        Returns: Json;
      };
      checkout_place_order: {
        Args: {
          p_guest_hash: string;
          p_input: Json;
          p_key: string;
          p_revision: string;
        };
        Returns: Json;
      };
      checkout_quote: {
        Args: { p_address: Json; p_guest_token_hash: string };
        Returns: Json;
      };
      checkout_recover_attempt: {
        Args: { p_guest_hash: string; p_key: string };
        Returns: Json;
      };
      checkout_release_ready: { Args: never; Returns: boolean };
      commerce_cart_add: {
        Args: {
          p_guest_token_hash: string;
          p_quantity: number;
          p_variant_id: string;
        };
        Returns: Json;
      };
      commerce_cart_apply_discount: {
        Args: { p_code: string; p_guest_token_hash: string };
        Returns: Json;
      };
      commerce_cart_import: {
        Args: { p_guest_token_hash: string; p_import_id: string; p_lines: Json };
        Returns: Json;
      };
      commerce_cart_merge_lines: {
        Args: { p_guest_token_hash: string; p_lines: Json };
        Returns: Json;
      };
      commerce_cart_set_quantity: {
        Args: {
          p_guest_token_hash: string;
          p_quantity: number;
          p_variant_id: string;
        };
        Returns: Json;
      };
      commerce_cart_snapshot: {
        Args: { p_guest_token_hash?: string };
        Returns: Json;
      };
      commerce_wishlist_merge: {
        Args: { p_variant_ids: string[] };
        Returns: Json;
      };
      commerce_wishlist_move_to_cart: {
        Args: { p_guest_token_hash: string; p_variant_id: string };
        Returns: Json;
      };
      commerce_wishlist_preview: {
        Args: { p_variant_ids: string[] };
        Returns: Json;
      };
      commerce_wishlist_set: {
        Args: { p_saved: boolean; p_variant_id: string };
        Returns: Json;
      };
      commerce_wishlist_snapshot: { Args: never; Returns: Json };
      order_email_worker: {
        Args: { p_input: Json; p_secret: string };
        Returns: Json;
      };
      staff_verification_action: {
        Args: { p_input: Json; p_order_id: string; p_request_id: string };
        Returns: Json;
      };
      staff_verification_detail: { Args: { p_order_id: string }; Returns: Json };
      staff_verification_policy: {
        Args: { p_input?: Json; p_request_id?: string };
        Returns: Json;
      };
      staff_verification_queue: {
        Args: { p_before?: string; p_filter?: string };
        Returns: Json;
      };
    };
    Enums: {
      abandoned_cart_status: "detected" | "notified" | "recovered" | "expired" | "suppressed";
      address_type: "shipping" | "billing";
      cart_status: "active" | "converted" | "abandoned" | "expired";
      cod_settlement_status:
        | "not_due"
        | "cash_expected"
        | "collected_by_courier"
        | "pending_reconciliation"
        | "reconciled"
        | "short_received"
        | "disputed"
        | "written_off";
      customer_status: "active" | "blocked" | "archived";
      delivery_attempt_status: "successful" | "failed" | "rescheduled";
      discount_type: "percentage" | "fixed_amount" | "free_shipping";
      inventory_event_type:
        | "initial_stock"
        | "purchase_receipt"
        | "reservation"
        | "reservation_release"
        | "order_fulfillment"
        | "return_restock"
        | "damage"
        | "manual_adjustment"
        | "rto_restock";
      notification_channel: "in_app" | "email" | "whatsapp";
      notification_delivery_status: "pending" | "sent" | "delivered" | "failed" | "cancelled";
      notification_priority: "low" | "normal" | "high" | "critical";
      order_status:
        | "pending_verification"
        | "confirmed"
        | "processing"
        | "packed"
        | "ready_to_ship"
        | "shipped"
        | "out_for_delivery"
        | "delivered"
        | "delivery_failed"
        | "rto_initiated"
        | "rto_in_transit"
        | "rto_received"
        | "cancelled";
      product_status: "draft" | "active" | "archived";
      product_type:
        "lamp" | "plant" | "planter" | "decor" | "candle" | "mirror" | "furniture" | "other";
      return_resolution:
        "exchange" | "store_credit" | "manual_refund" | "replacement" | "no_action";
      return_status:
        | "requested"
        | "under_review"
        | "approved"
        | "rejected"
        | "in_transit"
        | "received"
        | "completed"
        | "cancelled";
      review_status: "pending" | "approved" | "rejected";
      rto_status: "initiated" | "in_transit" | "received" | "restocked" | "damaged" | "closed";
      shipment_status:
        | "pending"
        | "packed"
        | "ready_to_ship"
        | "shipped"
        | "out_for_delivery"
        | "delivered"
        | "delivery_failed"
        | "rto_initiated"
        | "rto_in_transit"
        | "rto_received"
        | "cancelled";
      support_status: "open" | "pending_customer" | "pending_staff" | "resolved" | "closed";
      variant_status: "active" | "inactive" | "archived";
      verification_method: "whatsapp" | "admin";
      verification_status:
        "pending" | "sent" | "customer_confirmed" | "admin_approved" | "rejected" | "expired";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      abandoned_cart_status: ["detected", "notified", "recovered", "expired", "suppressed"],
      address_type: ["shipping", "billing"],
      cart_status: ["active", "converted", "abandoned", "expired"],
      cod_settlement_status: [
        "not_due",
        "cash_expected",
        "collected_by_courier",
        "pending_reconciliation",
        "reconciled",
        "short_received",
        "disputed",
        "written_off",
      ],
      customer_status: ["active", "blocked", "archived"],
      delivery_attempt_status: ["successful", "failed", "rescheduled"],
      discount_type: ["percentage", "fixed_amount", "free_shipping"],
      inventory_event_type: [
        "initial_stock",
        "purchase_receipt",
        "reservation",
        "reservation_release",
        "order_fulfillment",
        "return_restock",
        "damage",
        "manual_adjustment",
        "rto_restock",
      ],
      notification_channel: ["in_app", "email", "whatsapp"],
      notification_delivery_status: ["pending", "sent", "delivered", "failed", "cancelled"],
      notification_priority: ["low", "normal", "high", "critical"],
      order_status: [
        "pending_verification",
        "confirmed",
        "processing",
        "packed",
        "ready_to_ship",
        "shipped",
        "out_for_delivery",
        "delivered",
        "delivery_failed",
        "rto_initiated",
        "rto_in_transit",
        "rto_received",
        "cancelled",
      ],
      product_status: ["draft", "active", "archived"],
      product_type: ["lamp", "plant", "planter", "decor", "candle", "mirror", "furniture", "other"],
      return_resolution: ["exchange", "store_credit", "manual_refund", "replacement", "no_action"],
      return_status: [
        "requested",
        "under_review",
        "approved",
        "rejected",
        "in_transit",
        "received",
        "completed",
        "cancelled",
      ],
      review_status: ["pending", "approved", "rejected"],
      rto_status: ["initiated", "in_transit", "received", "restocked", "damaged", "closed"],
      shipment_status: [
        "pending",
        "packed",
        "ready_to_ship",
        "shipped",
        "out_for_delivery",
        "delivered",
        "delivery_failed",
        "rto_initiated",
        "rto_in_transit",
        "rto_received",
        "cancelled",
      ],
      support_status: ["open", "pending_customer", "pending_staff", "resolved", "closed"],
      variant_status: ["active", "inactive", "archived"],
      verification_method: ["whatsapp", "admin"],
      verification_status: [
        "pending",
        "sent",
        "customer_confirmed",
        "admin_approved",
        "rejected",
        "expired",
      ],
    },
  },
} as const;
