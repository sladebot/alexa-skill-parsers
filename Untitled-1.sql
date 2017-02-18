CREATE TABLE iot_devices(
  id BIGSERIAL PRIMARY KEY NOT NULL UNIQUE,
  user_id text,
  device_id int,
  is_active boolean
)

CREATE TABLE iot_data(
  id int PRIMARY KEY NOT NULL UNIQUE,
  exercise text,
  rating float,
  improvements text,
  device_id int REFERENCES iot_devices(device_id)
)