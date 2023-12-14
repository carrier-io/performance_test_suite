from tools import db


def init_db():
    from .models.suite import Suite
    from .models.thresholds import Threshold
    db.get_shared_metadata().create_all(bind=db.engine)

