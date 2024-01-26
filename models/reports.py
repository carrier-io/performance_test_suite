#     Copyright 2024 getcarrier.io
#
#     Licensed under the Apache License, Version 2.0 (the "License");
#     you may not use this file except in compliance with the License.
#     You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#     Unless required by applicable law or agreed to in writing, software
#     distributed under the License is distributed on an "AS IS" BASIS,
#     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#     See the License for the specific language governing permissions and
#     limitations under the License.
from uuid import uuid4

from pydantic import ValidationError
from sqlalchemy import String, Column, Integer, Float, JSON
from sqlalchemy.dialects.postgresql import ARRAY

from tools import db_tools, db, VaultClient


class SuiteReport(db_tools.AbstractBaseMixin, db.Base):
    __tablename__ = "performance_test_suite_reports"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, unique=False, nullable=False)
    suite_uid = Column(String(128), unique=False, nullable=False)
    uid = Column(String(128), unique=True, nullable=False)
    name = Column(String(128), unique=False)
    environment = Column(String(128), unique=False)
    type = Column(String(128), unique=False)
    end_time = Column(String(128), unique=False, nullable=True, default=None)
    start_time = Column(String(128), unique=False)
    tests = Column(JSON, unique=False, default=[])
    tags = Column(JSON, unique=False, default=[])
    suite_status = Column(
        JSON,
        default={
            "status": "Pending...",
            "percentage": 0,
            "description": "Check if there are enough workers to perform the test"
        }
    )
