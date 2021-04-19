select
  CODE as OFFENSE_CODE,
  NAME as OFFENSE_NAME
from {{ ref('offense_codes') }}
