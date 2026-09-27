-- One-time removal of the exact public rows exported at 2026-09-23T13:12:21.789Z.
-- External backup SHA-256: 496ac0b41b9c577fda0eaa81e69646cfc9cb1d5fc5d0ef190547a095ed66ec36
-- Run only after reading and verifying that private backup. Never run seed.sql after this.
-- No Storage object is removed. A changed row or a new photo linked to an old
-- collection aborts this transaction before any deletion is committed.

begin;

lock table public.photos, public.collections in share row exclusive mode;

do $$
declare
    expected_photo_ids text[] := array[
        'documentary-001', 'documentary-002', 'documentary-003',
        'landscape-001', 'landscape-002', 'landscape-003',
        'portrait-001', 'portrait-002', 'portrait-003'
    ];
    expected_collection_ids text[] := array['documentary', 'landscape', 'portrait'];
    deleted_photos integer;
    deleted_collections integer;
begin
    if exists (
        select 1
        from (values
            ('documentary-001', '2026-09-23T03:21:52.009109+00:00'::timestamptz),
            ('documentary-002', '2026-09-23T03:21:52.009109+00:00'::timestamptz),
            ('documentary-003', '2026-09-23T03:21:52.009109+00:00'::timestamptz),
            ('landscape-001', '2026-09-23T03:21:52.009109+00:00'::timestamptz),
            ('landscape-002', '2026-09-23T03:21:52.009109+00:00'::timestamptz),
            ('landscape-003', '2026-09-23T03:21:52.009109+00:00'::timestamptz),
            ('portrait-001', '2026-09-23T03:21:52.009109+00:00'::timestamptz),
            ('portrait-002', '2026-09-23T03:21:52.009109+00:00'::timestamptz),
            ('portrait-003', '2026-09-23T03:21:52.009109+00:00'::timestamptz)
        ) as expected(id, updated_at)
        left join public.photos as photo on photo.id = expected.id
        where photo.id is null or photo.updated_at is distinct from expected.updated_at
    ) then
        raise exception 'Photo inventory changed since backup; no rows removed';
    end if;

    if exists (
        select 1
        from (values
            ('documentary', '2026-09-23T03:21:52.009109+00:00'::timestamptz),
            ('landscape', '2026-09-23T03:21:52.009109+00:00'::timestamptz),
            ('portrait', '2026-09-23T12:51:35.98+00:00'::timestamptz)
        ) as expected(id, updated_at)
        left join public.collections as collection on collection.id = expected.id
        where collection.id is null or collection.updated_at is distinct from expected.updated_at
    ) then
        raise exception 'Collection inventory changed since backup; no rows removed';
    end if;

    if exists (
        select 1 from public.photos
        where collection_id = any(expected_collection_ids)
          and id <> all(expected_photo_ids)
    ) then
        raise exception 'A new photo is linked to an inventoried collection; no rows removed';
    end if;

    delete from public.photos where id = any(expected_photo_ids);
    get diagnostics deleted_photos = row_count;
    if deleted_photos <> 9 then
        raise exception 'Expected 9 photo deletions, got %; transaction rolled back', deleted_photos;
    end if;

    delete from public.collections where id = any(expected_collection_ids);
    get diagnostics deleted_collections = row_count;
    if deleted_collections <> 3 then
        raise exception 'Expected 3 collection deletions, got %; transaction rolled back', deleted_collections;
    end if;
end;
$$;

commit;

select (select count(*) from public.collections) as remaining_collections,
       (select count(*) from public.photos) as remaining_photos;
