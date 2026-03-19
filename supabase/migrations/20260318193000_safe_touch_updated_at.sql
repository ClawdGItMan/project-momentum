create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, auth, app_private
as $$
begin
  if to_jsonb(new) ? 'updated_at' then
    new := jsonb_populate_record(
      new,
      jsonb_build_object('updated_at', now())
    );
  end if;

  return new;
end;
$$;
