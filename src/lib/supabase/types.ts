export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      ads: {
        Row: {
          click_count: number;
          created_at: string;
          ends_at: string | null;
          id: string;
          image_path: string;
          image_path_mobile: string | null;
          impression_count: number;
          is_active: boolean;
          link_url: string;
          placement: string;
          starts_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          click_count?: number;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          image_path: string;
          image_path_mobile?: string | null;
          impression_count?: number;
          is_active?: boolean;
          link_url: string;
          placement: string;
          starts_at?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          click_count?: number;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          image_path?: string;
          image_path_mobile?: string | null;
          impression_count?: number;
          is_active?: boolean;
          link_url?: string;
          placement?: string;
          starts_at?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      article_tags: {
        Row: {
          article_id: string;
          created_at: string;
          tag_slug: string;
        };
        Insert: {
          article_id: string;
          created_at?: string;
          tag_slug: string;
        };
        Update: {
          article_id?: string;
          created_at?: string;
          tag_slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_tags_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "published_articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_tags_tag_slug_fkey";
            columns: ["tag_slug"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["slug"];
          },
        ];
      };
      articles: {
        Row: {
          audience: string | null;
          author_name: string | null;
          body_html: string | null;
          body_json: Json | null;
          category_slug: string;
          cover_alt: string | null;
          cover_caption: string | null;
          cover_path: string | null;
          created_at: string;
          exam_date: string | null;
          excerpt: string | null;
          fee_text: string | null;
          id: string;
          is_breaking: boolean;
          is_featured: boolean;
          is_good_to_know: boolean;
          is_special: boolean;
          level_text: string | null;
          location: string | null;
          organizer: string | null;
          publish_at: string | null;
          registration_deadline: string | null;
          registration_url: string | null;
          search_vector: unknown;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          special_until: string | null;
          status: string;
          subject: string | null;
          title: string;
          updated_at: string;
          view_count: number;
        };
        Insert: {
          audience?: string | null;
          author_name?: string | null;
          body_html?: string | null;
          body_json?: Json | null;
          category_slug: string;
          cover_alt?: string | null;
          cover_caption?: string | null;
          cover_path?: string | null;
          created_at?: string;
          exam_date?: string | null;
          excerpt?: string | null;
          fee_text?: string | null;
          id?: string;
          is_breaking?: boolean;
          is_featured?: boolean;
          is_good_to_know?: boolean;
          is_special?: boolean;
          level_text?: string | null;
          location?: string | null;
          organizer?: string | null;
          publish_at?: string | null;
          registration_deadline?: string | null;
          registration_url?: string | null;
          search_vector?: never;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          special_until?: string | null;
          status?: string;
          subject?: string | null;
          title: string;
          updated_at?: string;
          view_count?: number;
        };
        Update: {
          audience?: string | null;
          author_name?: string | null;
          body_html?: string | null;
          body_json?: Json | null;
          category_slug?: string;
          cover_alt?: string | null;
          cover_caption?: string | null;
          cover_path?: string | null;
          created_at?: string;
          exam_date?: string | null;
          excerpt?: string | null;
          fee_text?: string | null;
          id?: string;
          is_breaking?: boolean;
          is_featured?: boolean;
          is_good_to_know?: boolean;
          is_special?: boolean;
          level_text?: string | null;
          location?: string | null;
          organizer?: string | null;
          publish_at?: string | null;
          registration_deadline?: string | null;
          registration_url?: string | null;
          search_vector?: never;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          special_until?: string | null;
          status?: string;
          subject?: string | null;
          title?: string;
          updated_at?: string;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "articles_category_slug_fkey";
            columns: ["category_slug"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["slug"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          description: string;
          label: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          label: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          label?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          article_id: string;
          body: string;
          created_at: string;
          id: string;
          report_count: number;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          article_id: string;
          body: string;
          created_at?: string;
          id?: string;
          report_count?: number;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          article_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          report_count?: number;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "published_articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          body_html: string | null;
          body_json: Json | null;
          contact_phone: string | null;
          cover_alt: string | null;
          cover_path: string | null;
          created_at: string;
          ends_at: string | null;
          event_type: string | null;
          excerpt: string | null;
          id: string;
          is_featured: boolean;
          location: string | null;
          organizer: string | null;
          price_text: string | null;
          publish_at: string | null;
          registration_url: string | null;
          slug: string;
          starts_at: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          body_html?: string | null;
          body_json?: Json | null;
          contact_phone?: string | null;
          cover_alt?: string | null;
          cover_path?: string | null;
          created_at?: string;
          ends_at?: string | null;
          event_type?: string | null;
          excerpt?: string | null;
          id?: string;
          is_featured?: boolean;
          location?: string | null;
          organizer?: string | null;
          price_text?: string | null;
          publish_at?: string | null;
          registration_url?: string | null;
          slug: string;
          starts_at: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          body_html?: string | null;
          body_json?: Json | null;
          contact_phone?: string | null;
          cover_alt?: string | null;
          cover_path?: string | null;
          created_at?: string;
          ends_at?: string | null;
          event_type?: string | null;
          excerpt?: string | null;
          id?: string;
          is_featured?: boolean;
          location?: string | null;
          organizer?: string | null;
          price_text?: string | null;
          publish_at?: string | null;
          registration_url?: string | null;
          slug?: string;
          starts_at?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      faq_items: {
        Row: {
          answer: string;
          created_at: string;
          id: string;
          question: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          answer: string;
          created_at?: string;
          id?: string;
          question: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          answer?: string;
          created_at?: string;
          id?: string;
          question?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          role: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          role?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_pages: {
        Row: {
          body_html: string | null;
          body_json: Json | null;
          created_at: string;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          body_html?: string | null;
          body_json?: Json | null;
          created_at?: string;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          body_html?: string | null;
          body_json?: Json | null;
          created_at?: string;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          admin_note: string | null;
          created_at: string;
          email: string | null;
          first_name: string;
          id: string;
          ip_hash: string | null;
          kind: string;
          last_name: string | null;
          message: string;
          organization: string | null;
          phone: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          admin_note?: string | null;
          created_at?: string;
          email?: string | null;
          first_name: string;
          id?: string;
          ip_hash?: string | null;
          kind: string;
          last_name?: string | null;
          message: string;
          organization?: string | null;
          phone?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          admin_note?: string | null;
          created_at?: string;
          email?: string | null;
          first_name?: string;
          id?: string;
          ip_hash?: string | null;
          kind?: string;
          last_name?: string | null;
          message?: string;
          organization?: string | null;
          phone?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          created_at: string;
          label: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          label: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          label?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      published_articles: {
        Row: {
          audience: string | null;
          author_name: string | null;
          body_html: string | null;
          body_json: Json | null;
          category_slug: string | null;
          cover_alt: string | null;
          cover_caption: string | null;
          cover_path: string | null;
          created_at: string | null;
          exam_date: string | null;
          excerpt: string | null;
          fee_text: string | null;
          id: string | null;
          is_breaking: boolean | null;
          is_featured: boolean | null;
          is_good_to_know: boolean | null;
          is_special: boolean | null;
          level_text: string | null;
          location: string | null;
          organizer: string | null;
          publish_at: string | null;
          registration_deadline: string | null;
          registration_url: string | null;
          search_vector: unknown;
          seo_description: string | null;
          seo_title: string | null;
          slug: string | null;
          special_until: string | null;
          status: string | null;
          subject: string | null;
          title: string | null;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          audience?: string | null;
          author_name?: string | null;
          body_html?: string | null;
          body_json?: Json | null;
          category_slug?: string | null;
          cover_alt?: string | null;
          cover_caption?: string | null;
          cover_path?: string | null;
          created_at?: string | null;
          exam_date?: string | null;
          excerpt?: string | null;
          fee_text?: string | null;
          id?: string | null;
          is_breaking?: boolean | null;
          is_featured?: boolean | null;
          is_good_to_know?: boolean | null;
          is_special?: boolean | null;
          level_text?: string | null;
          location?: string | null;
          organizer?: string | null;
          publish_at?: string | null;
          registration_deadline?: string | null;
          registration_url?: string | null;
          search_vector?: unknown;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string | null;
          special_until?: string | null;
          status?: string | null;
          subject?: string | null;
          title?: string | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          audience?: string | null;
          author_name?: string | null;
          body_html?: string | null;
          body_json?: Json | null;
          category_slug?: string | null;
          cover_alt?: string | null;
          cover_caption?: string | null;
          cover_path?: string | null;
          created_at?: string | null;
          exam_date?: string | null;
          excerpt?: string | null;
          fee_text?: string | null;
          id?: string | null;
          is_breaking?: boolean | null;
          is_featured?: boolean | null;
          is_good_to_know?: boolean | null;
          is_special?: boolean | null;
          level_text?: string | null;
          location?: string | null;
          organizer?: string | null;
          publish_at?: string | null;
          registration_deadline?: string | null;
          registration_url?: string | null;
          search_vector?: unknown;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string | null;
          special_until?: string | null;
          status?: string | null;
          subject?: string | null;
          title?: string | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "articles_category_slug_fkey";
            columns: ["category_slug"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["slug"];
          },
        ];
      };
      published_events: {
        Row: {
          body_html: string | null;
          body_json: Json | null;
          contact_phone: string | null;
          cover_alt: string | null;
          cover_path: string | null;
          created_at: string | null;
          ends_at: string | null;
          event_type: string | null;
          excerpt: string | null;
          id: string | null;
          is_featured: boolean | null;
          location: string | null;
          organizer: string | null;
          price_text: string | null;
          publish_at: string | null;
          registration_url: string | null;
          slug: string | null;
          starts_at: string | null;
          status: string | null;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          body_html?: string | null;
          body_json?: Json | null;
          contact_phone?: string | null;
          cover_alt?: string | null;
          cover_path?: string | null;
          created_at?: string | null;
          ends_at?: string | null;
          event_type?: string | null;
          excerpt?: string | null;
          id?: string | null;
          is_featured?: boolean | null;
          location?: string | null;
          organizer?: string | null;
          price_text?: string | null;
          publish_at?: string | null;
          registration_url?: string | null;
          slug?: string | null;
          starts_at?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          body_html?: string | null;
          body_json?: Json | null;
          contact_phone?: string | null;
          cover_alt?: string | null;
          cover_path?: string | null;
          created_at?: string | null;
          ends_at?: string | null;
          event_type?: string | null;
          excerpt?: string | null;
          id?: string | null;
          is_featured?: boolean | null;
          location?: string | null;
          organizer?: string | null;
          price_text?: string | null;
          publish_at?: string | null;
          registration_url?: string | null;
          slug?: string | null;
          starts_at?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      record_ad_click: { Args: { ad_id: string }; Returns: string };
      record_ad_impression: { Args: { ad_id: string }; Returns: undefined };
      record_article_view: { Args: { article_id: string }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
