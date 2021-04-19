with crime as (
    select * from {{ ref('stg_crime') }}
),
offense_codes as (
    select
      OFFENSE_CODE,
      OFFENSE_NAME    
    from {{ ref('stg_offense_codes') }}
),
final as (
    select
      crime.INCIDENT_ID,
      offense_codes.OFFENSE_NAME,
      crime.OFFENSE_CODE_GROUP,
      crime.OFFENSE_DESCRIPTION,
      crime.DISTRICT,
      crime.REPORTING_AREA,
      crime.SHOOTING,
      crime.OCCURRED_ON_DATE,
      crime.YEAR,
      crime.MONTH,
      crime.DAY_OF_WEEK,
      crime.HOUR,
      crime.UCR_PART,
      crime.STREET,
      crime.Lat,
      crime.Long,
      crime.Location
    from crime
      left join offense_codes using (OFFENSE_CODE)
)
select * from final
