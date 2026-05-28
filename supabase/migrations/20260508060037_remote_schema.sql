-- Constraints, Indexes, and Permissions (Tables created in migration 20260508055402)

alter sequence "public"."amenities_id_seq" owned by "public"."amenities"."id";

alter sequence "public"."cafe_images_id_seq" owned by "public"."cafe_images"."id";

alter sequence "public"."notifications_id_seq" owned by "public"."notifications"."id";

alter sequence "public"."review_images_id_seq" owned by "public"."review_images"."id";

alter sequence "public"."reviews_id_seq" owned by "public"."reviews"."id";

alter table "public"."cafe_amenities" add constraint "cafe_amenities_amenity_id_fkey" FOREIGN KEY (amenity_id) REFERENCES public.amenities(id) ON DELETE CASCADE not valid;

alter table "public"."cafe_amenities" validate constraint "cafe_amenities_amenity_id_fkey";

alter table "public"."cafe_amenities" add constraint "cafe_amenities_cafe_id_fkey" FOREIGN KEY (cafe_id) REFERENCES public.cafes(id) ON DELETE CASCADE not valid;

alter table "public"."cafe_amenities" validate constraint "cafe_amenities_cafe_id_fkey";

alter table "public"."cafe_images" add constraint "cafe_images_cafe_id_fkey" FOREIGN KEY (cafe_id) REFERENCES public.cafes(id) ON DELETE CASCADE not valid;

alter table "public"."cafe_images" validate constraint "cafe_images_cafe_id_fkey";

alter table "public"."cafes" add constraint "cafes_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."cafes" validate constraint "cafes_owner_id_fkey";

alter table "public"."favorites" add constraint "favorites_cafe_id_fkey" FOREIGN KEY (cafe_id) REFERENCES public.cafes(id) ON DELETE CASCADE not valid;

alter table "public"."favorites" validate constraint "favorites_cafe_id_fkey";

alter table "public"."favorites" add constraint "favorites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."favorites" validate constraint "favorites_user_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) not valid;

alter table "public"."profiles" validate constraint "profiles_role_id_fkey";

alter table "public"."reservations" add constraint "reservations_cafe_id_fkey" FOREIGN KEY (cafe_id) REFERENCES public.cafes(id) ON DELETE CASCADE not valid;

alter table "public"."reservations" validate constraint "reservations_cafe_id_fkey";

alter table "public"."reservations" add constraint "reservations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."reservations" validate constraint "reservations_user_id_fkey";

alter table "public"."review_images" add constraint "review_images_review_id_fkey" FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE not valid;

alter table "public"."review_images" validate constraint "review_images_review_id_fkey";

alter table "public"."reviews" add constraint "reviews_cafe_id_fkey" FOREIGN KEY (cafe_id) REFERENCES public.cafes(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_cafe_id_fkey";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."reviews" add constraint "reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

grant delete on table "public"."amenities" to "anon";

grant insert on table "public"."amenities" to "anon";

grant references on table "public"."amenities" to "anon";

grant select on table "public"."amenities" to "anon";

grant trigger on table "public"."amenities" to "anon";

grant truncate on table "public"."amenities" to "anon";

grant update on table "public"."amenities" to "anon";

grant delete on table "public"."amenities" to "authenticated";

grant insert on table "public"."amenities" to "authenticated";

grant references on table "public"."amenities" to "authenticated";

grant select on table "public"."amenities" to "authenticated";

grant trigger on table "public"."amenities" to "authenticated";

grant truncate on table "public"."amenities" to "authenticated";

grant update on table "public"."amenities" to "authenticated";

grant delete on table "public"."amenities" to "service_role";

grant insert on table "public"."amenities" to "service_role";

grant references on table "public"."amenities" to "service_role";

grant select on table "public"."amenities" to "service_role";

grant trigger on table "public"."amenities" to "service_role";

grant truncate on table "public"."amenities" to "service_role";

grant update on table "public"."amenities" to "service_role";

grant delete on table "public"."cafe_amenities" to "anon";

grant insert on table "public"."cafe_amenities" to "anon";

grant references on table "public"."cafe_amenities" to "anon";

grant select on table "public"."cafe_amenities" to "anon";

grant trigger on table "public"."cafe_amenities" to "anon";

grant truncate on table "public"."cafe_amenities" to "anon";

grant update on table "public"."cafe_amenities" to "anon";

grant delete on table "public"."cafe_amenities" to "authenticated";

grant insert on table "public"."cafe_amenities" to "authenticated";

grant references on table "public"."cafe_amenities" to "authenticated";

grant select on table "public"."cafe_amenities" to "authenticated";

grant trigger on table "public"."cafe_amenities" to "authenticated";

grant truncate on table "public"."cafe_amenities" to "authenticated";

grant update on table "public"."cafe_amenities" to "authenticated";

grant delete on table "public"."cafe_amenities" to "service_role";

grant insert on table "public"."cafe_amenities" to "service_role";

grant references on table "public"."cafe_amenities" to "service_role";

grant select on table "public"."cafe_amenities" to "service_role";

grant trigger on table "public"."cafe_amenities" to "service_role";

grant truncate on table "public"."cafe_amenities" to "service_role";

grant update on table "public"."cafe_amenities" to "service_role";

grant delete on table "public"."cafe_images" to "anon";

grant insert on table "public"."cafe_images" to "anon";

grant references on table "public"."cafe_images" to "anon";

grant select on table "public"."cafe_images" to "anon";

grant trigger on table "public"."cafe_images" to "anon";

grant truncate on table "public"."cafe_images" to "anon";

grant update on table "public"."cafe_images" to "anon";

grant delete on table "public"."cafe_images" to "authenticated";

grant insert on table "public"."cafe_images" to "authenticated";

grant references on table "public"."cafe_images" to "authenticated";

grant select on table "public"."cafe_images" to "authenticated";

grant trigger on table "public"."cafe_images" to "authenticated";

grant truncate on table "public"."cafe_images" to "authenticated";

grant update on table "public"."cafe_images" to "authenticated";

grant delete on table "public"."cafe_images" to "service_role";

grant insert on table "public"."cafe_images" to "service_role";

grant references on table "public"."cafe_images" to "service_role";

grant select on table "public"."cafe_images" to "service_role";

grant trigger on table "public"."cafe_images" to "service_role";

grant truncate on table "public"."cafe_images" to "service_role";

grant update on table "public"."cafe_images" to "service_role";

grant delete on table "public"."cafes" to "anon";

grant insert on table "public"."cafes" to "anon";

grant references on table "public"."cafes" to "anon";

grant select on table "public"."cafes" to "anon";

grant trigger on table "public"."cafes" to "anon";

grant truncate on table "public"."cafes" to "anon";

grant update on table "public"."cafes" to "anon";

grant delete on table "public"."cafes" to "authenticated";

grant insert on table "public"."cafes" to "authenticated";

grant references on table "public"."cafes" to "authenticated";

grant select on table "public"."cafes" to "authenticated";

grant trigger on table "public"."cafes" to "authenticated";

grant truncate on table "public"."cafes" to "authenticated";

grant update on table "public"."cafes" to "authenticated";

grant delete on table "public"."cafes" to "service_role";

grant insert on table "public"."cafes" to "service_role";

grant references on table "public"."cafes" to "service_role";

grant select on table "public"."cafes" to "service_role";

grant trigger on table "public"."cafes" to "service_role";

grant truncate on table "public"."cafes" to "service_role";

grant update on table "public"."cafes" to "service_role";

grant delete on table "public"."favorites" to "anon";

grant insert on table "public"."favorites" to "anon";

grant references on table "public"."favorites" to "anon";

grant select on table "public"."favorites" to "anon";

grant trigger on table "public"."favorites" to "anon";

grant truncate on table "public"."favorites" to "anon";

grant update on table "public"."favorites" to "anon";

grant delete on table "public"."favorites" to "authenticated";

grant insert on table "public"."favorites" to "authenticated";

grant references on table "public"."favorites" to "authenticated";

grant select on table "public"."favorites" to "authenticated";

grant trigger on table "public"."favorites" to "authenticated";

grant truncate on table "public"."favorites" to "authenticated";

grant update on table "public"."favorites" to "authenticated";

grant delete on table "public"."favorites" to "service_role";

grant insert on table "public"."favorites" to "service_role";

grant references on table "public"."favorites" to "service_role";

grant select on table "public"."favorites" to "service_role";

grant trigger on table "public"."favorites" to "service_role";

grant truncate on table "public"."favorites" to "service_role";

grant update on table "public"."favorites" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."reservations" to "anon";

grant insert on table "public"."reservations" to "anon";

grant references on table "public"."reservations" to "anon";

grant select on table "public"."reservations" to "anon";

grant trigger on table "public"."reservations" to "anon";

grant truncate on table "public"."reservations" to "anon";

grant update on table "public"."reservations" to "anon";

grant delete on table "public"."reservations" to "authenticated";

grant insert on table "public"."reservations" to "authenticated";

grant references on table "public"."reservations" to "authenticated";

grant select on table "public"."reservations" to "authenticated";

grant trigger on table "public"."reservations" to "authenticated";

grant truncate on table "public"."reservations" to "authenticated";

grant update on table "public"."reservations" to "authenticated";

grant delete on table "public"."reservations" to "service_role";

grant insert on table "public"."reservations" to "service_role";

grant references on table "public"."reservations" to "service_role";

grant select on table "public"."reservations" to "service_role";

grant trigger on table "public"."reservations" to "service_role";

grant truncate on table "public"."reservations" to "service_role";

grant update on table "public"."reservations" to "service_role";

grant delete on table "public"."review_images" to "anon";

grant insert on table "public"."review_images" to "anon";

grant references on table "public"."review_images" to "anon";

grant select on table "public"."review_images" to "anon";

grant trigger on table "public"."review_images" to "anon";

grant truncate on table "public"."review_images" to "anon";

grant update on table "public"."review_images" to "anon";

grant delete on table "public"."review_images" to "authenticated";

grant insert on table "public"."review_images" to "authenticated";

grant references on table "public"."review_images" to "authenticated";

grant select on table "public"."review_images" to "authenticated";

grant trigger on table "public"."review_images" to "authenticated";

grant truncate on table "public"."review_images" to "authenticated";

grant update on table "public"."review_images" to "authenticated";

grant delete on table "public"."review_images" to "service_role";

grant insert on table "public"."review_images" to "service_role";

grant references on table "public"."review_images" to "service_role";

grant select on table "public"."review_images" to "service_role";

grant trigger on table "public"."review_images" to "service_role";

grant truncate on table "public"."review_images" to "service_role";

grant update on table "public"."review_images" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."roles" to "anon";

grant insert on table "public"."roles" to "anon";

grant references on table "public"."roles" to "anon";

grant select on table "public"."roles" to "anon";

grant trigger on table "public"."roles" to "anon";

grant truncate on table "public"."roles" to "anon";

grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";

grant insert on table "public"."roles" to "authenticated";

grant references on table "public"."roles" to "authenticated";

grant select on table "public"."roles" to "authenticated";

grant trigger on table "public"."roles" to "authenticated";

grant truncate on table "public"."roles" to "authenticated";

grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."roles" to "service_role";

grant insert on table "public"."roles" to "service_role";

grant references on table "public"."roles" to "service_role";

grant select on table "public"."roles" to "service_role";

grant trigger on table "public"."roles" to "service_role";

grant truncate on table "public"."roles" to "service_role";

grant update on table "public"."roles" to "service_role";


