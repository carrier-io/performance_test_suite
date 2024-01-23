import json
from queue import Empty
from typing import Union, Tuple, Optional

import re
from datetime import datetime
from uuid import uuid4
from pydantic import ValidationError
from pylon.core.tools import log

# from ..constants import JOB_CONTAINER_MAPPING, JOB_TYPE_MAPPING
from tools import TaskManager, rpc_tools, api_tools
from ...backend_performance.models.tests import Test
from ...backend_performance.models.reports import Report


def _calculate_limit(limit, total):
    return len(total) if limit == 'All' else limit


def run_suite(event: dict, project_id, config_only: bool = False, execution: bool = False, engagement_id: str = None
) -> dict:
    event["job_type"] = "suite"
    # TODO set up correct rabbit settings
    event["cc_env_vars"] = {
        "RABBIT_USER": "{{secret.rabbit_project_user}}",
        "RABBIT_PASSWORD": "{{secret.rabbit_project_password}}",
        "RABBIT_VHOST": "{{secret.rabbit_project_vhost}}",
        "RABBIT_HOST": "{{secret.rabbit_host}}",
        "GALLOPER_URL": "{{secret.galloper_url}}",
        "TOKEN": "{{secret.auth_token}}",
        "PROJECT_ID": "{{secret.project_id}}",
    }

    logger_stop_words = event.pop('logger_stop_words', [])

    # if config_only:
    #     event['logger_stop_words'] = list(logger_stop_words)
    #     return event

    for test in event["tests"]:
        test_query = Test.query.filter(Test.get_api_filter(project_id, test["id"])).first()
        test_data = test_query.configure_execution_json(execution=execution)
        test_data["logger_stop_words"] = list(test_data["logger_stop_words"])
        test["execution_json"] = test_data
        # TODO create report
        from ...backend_performance.utils.utils import get_backend_test_data
        test_data = get_backend_test_data(test_data)
        report = Report(
            name=test_data["test_name"],
            project_id=project_id,
            environment=test_data["environment"],
            type=test_data["type"],
            end_time=None,
            start_time=test_data["start_time"],
            failures=0,
            total=0,
            thresholds_missed=0,
            throughput=0,
            vusers=test_data["vusers"],
            pct50=0, pct75=0, pct90=0, pct95=0, pct99=0,
            _max=0, _min=0, mean=0,
            duration=test_data["duration"],
            build_id=test_data["build_id"],
            lg_type=test_data["lg_type"],
            onexx=0, twoxx=0, threexx=0, fourxx=0, fivexx=0,
            requests=[],
            test_uid=test_query.uid,
            test_config=test_query.api_json(),
            engagement=engagement_id
        )
        report.insert()
        test["REPORT_ID"] = str(report.id)
        test["build_id"] = test_data["build_id"]


    resp = TaskManager(project_id).run_task([event], logger_stop_words=logger_stop_words)

    return resp