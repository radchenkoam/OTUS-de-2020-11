select  offense_name,
        offense_code_group,
        count(*) as offense_count
from {{ ref('crimes') }}
group by offense_name, offense_code_group
order by offense_name, offense_code_group
