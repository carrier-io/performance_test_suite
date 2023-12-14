from typing import Optional, Literal, List
from pydantic import BaseModel, validator, AnyUrl, parse_obj_as, root_validator, constr
from uuid import uuid4


class SuitePD(BaseModel):
    uid: Optional[str]
    project_id: int
    name: str
    env: str
    type: str
    tests: List[dict]
    reporters: List[dict]

    @validator('uid', pre=True, always=True)
    def set_uid(cls, value: Optional[str]):
        if not value:
            return str(uuid4())
        return value
