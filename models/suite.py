from sqlalchemy import Column, Integer, String, Float, JSON

from tools import db_tools, db


class Suite(db_tools.AbstractBaseMixin, db.Base):
    __tablename__ = "performance_test_suite"
    id = Column(Integer, primary_key=True)
    uid = Column(String(128), unique=True, nullable=False)
    project_id = Column(Integer, unique=False, nullable=False)
    name = Column(String, unique=False, nullable=False)
    env = Column(String, unique=False, nullable=False)
    type = Column(String, unique=False, nullable=False)
    tests = Column(JSON, nullable=True)
    reporters = Column(JSON, nullable=True)

