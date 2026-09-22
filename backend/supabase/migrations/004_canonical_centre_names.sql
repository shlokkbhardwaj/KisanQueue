-- Canonical procurement-centre names.
-- Removes legacy UI labels from the database if an older demo dataset used them.
update mandis set name='Kisan Procurement Centre - Ambala'
where lower(name) in ('centre a', 'centre a — ambala cantt', 'centre a - ambala cantt');

update mandis set name='Kisan Procurement Centre - Yamunanagar'
where lower(name) in ('centre b', 'centre b — yamunanagar', 'centre b - yamunanagar');

update mandis set name='Kisan Procurement Centre - Kurukshetra'
where lower(name) in ('centre c', 'centre c — kurukshetra', 'centre c - kurukshetra');

insert into mandis(name,address,district,state,latitude,longitude,operating_hours,contact,status,capacity_per_slot)
select 'Kisan Procurement Centre - Kurukshetra','Kurukshetra, Haryana','Kurukshetra','Haryana',29.9695,76.8783,'08:00-18:00','1800-000-000','ACTIVE',10
where not exists (select 1 from mandis where name='Kisan Procurement Centre - Kurukshetra');

insert into mandi_crop_acceptance(mandi_id,crop_id,accepted)
select m.id,c.id,true from mandis m cross join crops c
where m.name='Kisan Procurement Centre - Kurukshetra' and c.active
on conflict(mandi_id,crop_id) do update set accepted=excluded.accepted;
