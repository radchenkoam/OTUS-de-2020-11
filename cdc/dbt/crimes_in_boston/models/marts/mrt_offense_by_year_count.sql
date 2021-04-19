select  year,
        offense_name,
        offense_code_group,
        count(*) as offense_count
from {{ ref('crimes') }}
group by year, offense_name, offense_code_group
order by year, offense_name, offense_code_group
