-- не работает! создавать таблицы руками
set search_path to boston_crimes;
create schema if not exists dbt;

create table if not exists dbt.crime (
  "INCIDENT_NUMBER" varchar(20),
  "OFFENSE_CODE" int,
  "OFFENSE_CODE_GROUP" varchar(50),
  "OFFENSE_DESCRIPTION" varchar(255),
  "DISTRICT" varchar(10),
  "REPORTING_AREA" int,
  "SHOOTING" varchar(1),
  "OCCURRED_ON_DATE" timestamp,
  "YEAR" int,
  "MONTH" int,
  "DAY_OF_WEEK" varchar(15),
  "HOUR" int,
  "UCR_PART" varchar(15),
  "STREET" varchar(100),
  "Lat" float,
  "Long" float,
  "Location" varchar(50)
);

create table if not exists dbt.offense_codes (
  "CODE" int,
  "NAME" varchar(100)
);


-- enable PostGis
/* create extension postgis;

create table if not exists dbt.crime (
  incident_number varchar(20),
  offense_code int,
  offense_code_group varchar(50),
  offense_description varchar(255),
  district varchar(10),
  reporting_area int,
  shooting varchar(1),
  occurred_on_date timestamp,
  "year" int,
  "month" int,
  day_of_week varchar(15),
  "hour" int,
  ucr_part varchar(15),
  street varchar(100),
  lat float,
  long float,
  "location" varchar(50)
);

create table if not exists dbt.offense_codes (
  code int,
  "name" varchar(100)
); */
