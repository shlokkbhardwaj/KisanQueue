-- Demo/reference data only. No credentials are stored here.
insert into crops(name,unit,active) values
 ('Wheat','quintals',true),('Mustard','quintals',true),('Rice','quintals',true),('Bajra','quintals',true)
on conflict(name) do update set active=excluded.active;
insert into mandis(name,address,district,state,latitude,longitude,operating_hours,contact,status,capacity_per_slot) values
 ('Kisan Procurement Centre - Ambala','Ambala Cantt, Haryana','Ambala','Haryana',30.3782,76.7767,'08:00-18:00','1800-000-000','ACTIVE',10),
 ('Kisan Procurement Centre - Yamunanagar','Yamunanagar, Haryana','Yamunanagar','Haryana',30.1290,77.2674,'08:00-18:00','1800-000-000','ACTIVE',10),
 ('Kisan Procurement Centre - Kurukshetra','Kurukshetra, Haryana','Kurukshetra','Haryana',29.9695,76.8783,'08:00-18:00','1800-000-000','ACTIVE',10)
on conflict do nothing;
insert into mandi_crop_acceptance(mandi_id,crop_id,accepted)
select m.id,c.id from mandis m cross join crops c where m.status='ACTIVE' and c.active
on conflict(mandi_id,crop_id) do nothing;
