-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id integer NOT NULL,
  role_name text NOT NULL,
  PRIMARY KEY (id)
);

-- Create other tables from the schema
create type "public"."cafe_image_type" as enum ('INTERIOR', 'MENU');
create type "public"."quiet_level_type" as enum ('SILENT', 'QUIET', 'NORMAL');
create type "public"."reservation_status" as enum ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
create type "public"."wifi_speed_level" as enum ('FAST', 'NORMAL', 'SLOW');

create sequence "public"."amenities_id_seq";
create sequence "public"."cafe_images_id_seq";
create sequence "public"."notifications_id_seq";
create sequence "public"."review_images_id_seq";
create sequence "public"."reviews_id_seq";

create table "public"."amenities" (
  "id" integer NOT NULL DEFAULT nextval('public.amenities_id_seq'::regclass),
  "name_ja" text NOT NULL,
  "name_vi" text,
  PRIMARY KEY (id)
);

create table "public"."cafe_amenities" (
  "cafe_id" uuid NOT NULL,
  "amenity_id" integer NOT NULL,
  PRIMARY KEY (cafe_id, amenity_id)
);

create table "public"."cafe_images" (
  "id" integer NOT NULL DEFAULT nextval('public.cafe_images_id_seq'::regclass),
  "cafe_id" uuid,
  "image_url" text NOT NULL,
  "image_type" public.cafe_image_type DEFAULT 'INTERIOR',
  PRIMARY KEY (id)
);

create table "public"."cafes" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "owner_id" uuid,
  "name" text NOT NULL,
  "address" text NOT NULL,
  "lat" numeric(10,8),
  "lng" numeric(11,8),
  "wifi_speed" public.wifi_speed_level DEFAULT 'NORMAL',
  "quiet_level" public.quiet_level_type DEFAULT 'NORMAL',
  "open_time" time without time zone,
  "close_time" time without time zone,
  "description_ja" text,
  "avg_rating" numeric(3,2) DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

create table "public"."favorites" (
  "user_id" uuid NOT NULL,
  "cafe_id" uuid NOT NULL,
  PRIMARY KEY (user_id, cafe_id)
);

create table "public"."notifications" (
  "id" integer NOT NULL DEFAULT nextval('public.notifications_id_seq'::regclass),
  "user_id" uuid,
  "title" text,
  "content" text,
  "is_read" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

create table "public"."profiles" (
  "id" uuid NOT NULL,
  "role_id" integer DEFAULT 3,
  "full_name" text,
  "avatar_url" text,
  "updated_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

create table "public"."reservations" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "cafe_id" uuid NOT NULL,
  "res_date" date NOT NULL,
  "res_time" time without time zone NOT NULL,
  "num_guests" integer NOT NULL,
  "status" public.reservation_status DEFAULT 'PENDING',
  "created_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

create table "public"."reviews" (
  "id" integer NOT NULL DEFAULT nextval('public.reviews_id_seq'::regclass),
  "user_id" uuid NOT NULL,
  "cafe_id" uuid NOT NULL,
  "rating" integer NOT NULL,
  "comment" text,
  "created_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

create table "public"."review_images" (
  "id" integer NOT NULL DEFAULT nextval('public.review_images_id_seq'::regclass),
  "review_id" integer NOT NULL,
  "image_url" text NOT NULL,
  PRIMARY KEY (id)
);

ALTER TABLE "public"."amenities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cafe_amenities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cafe_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cafes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."review_images" ENABLE ROW LEVEL SECURITY;
