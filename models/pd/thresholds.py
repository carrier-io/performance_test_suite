from typing import Optional, Literal
from pydantic import BaseModel, validator, AnyUrl, parse_obj_as, root_validator, constr



class ThresholdPD(BaseModel):
    project_id: int
    suite_name: str
    environment: str
    scope: str
    target: Literal['throughput', 'error_rate', 'response_time']
    aggregation: Literal['max', 'min', 'avg', 'pct95', 'pct50']
    comparison: Literal['gte', 'lte', 'lt', 'gt', 'eq']
    value: float
