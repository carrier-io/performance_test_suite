import json
import time
from queue import Empty
from typing import Union, Tuple, Optional

import re
from datetime import datetime
from uuid import uuid4
from pydantic import ValidationError
from pylon.core.tools import log

# from ..constants import JOB_CONTAINER_MAPPING, JOB_TYPE_MAPPING
from tools import TaskManager, rpc_tools, api_tools


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

    reports = {"backend": [], "ui": []}
    for test in event["tests"]:
        if test["job_type"] in ["perfmeter", "perfgun"]:
            from ...backend_performance.models.tests import Test
            test_query = Test.query.filter(Test.get_api_filter(project_id, test["id"])).first()
            test_data = test_query.configure_execution_json(execution=execution)
            test_data["execution_params"] = update_backend_test_data(test_data["execution_params"],
                                                                     test["test_parameters"], test["job_type"])
            test_data["logger_stop_words"] = list(test_data["logger_stop_words"])
            test["execution_json"] = test_data
            from ...backend_performance.utils.utils import get_backend_test_data
            from ...backend_performance.models.reports import Report
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
            reports["backend"].append(report.id)
            test["REPORT_ID"] = str(report.id)
            test["build_id"] = test_data["build_id"]
        else:
            from ...ui_performance.models.ui_tests import UIPerformanceTest
            test_query = UIPerformanceTest.query.filter(UIPerformanceTest.get_api_filter(project_id, test["id"])).first()
            test_data = test_query.configure_execution_json(execution=execution)
            test["execution_json"] = test_data
            from ...ui_performance.models.ui_report import UIReport
            build_id = str(uuid4())
            report = UIReport(
                uid=build_id,
                name=test["name"],
                project_id=project_id,
                start_time=time.strftime('%Y-%m-%d %H:%M:%S'),
                is_active=True,
                browser="chrome",
                browser_version="unknown",
                environment=next((param["default"] for param in test["test_parameters"] if param["name"] == "env_type"), None),
                test_type=next((param["default"] for param in test["test_parameters"] if param["name"] == "test_type"), None),
                loops=test["loops"],
                aggregation=test["aggregation"],
                test_config=test_query.api_json(),
                test_uid=test["test_uid"],
                engagement=engagement_id
            )
            report.insert()
            reports["ui"].append(report.id)
            test["REPORT_ID"] = str(report.uid)
            test["build_id"] = build_id


    from ..models.reports import SuiteReport
    suite_report = SuiteReport(
        name=event["name"],
        uid=str(uuid4()),
        project_id=project_id,
        environment=event["env"],
        type=event["type"],
        start_time=datetime.utcnow().isoformat("T") + "Z",
        tests=reports,
        suite_uid=event["uid"]
    )
    suite_report.insert()
    event["suite_report_id"] = suite_report.id
    resp = TaskManager(project_id).run_task([event], logger_stop_words=logger_stop_words)

    return resp

def update_backend_test_data(test_data, test_parameters, job_type):
    # Convert the input string to a dictionary
    data = json.loads(test_data)

    # Extract the "cmd" value from the dictionary
    if job_type == "perfmeter":
        cmd_value = data.get("cmd", "")
    else:
        cmd_value = data.get("GATLING_TEST_PARAMS", "")

    # Iterate over test_parameters and replace values in cmd_value
    for param in test_parameters:
        param_name = param["name"]
        param_default = param["default"]
        if job_type == "perfmeter":
            replacement = f"-J{param_name}={param_default}"
            cmd_value = cmd_value.replace(f"-J{param_name}={cmd_value.split(f'-J{param_name}=')[1].split(' ')[0]}",
                                      replacement)
            # Check if the parameter is not present in cmd_value, then add it
            if f"-J{param_name}=" not in cmd_value:
                cmd_value += f" {replacement}"
        else:
            replacement = f"-D{param_name}={param_default}"
            cmd_value = cmd_value.replace(f"-D{param_name}={cmd_value.split(f'-D{param_name}=')[1].split(' ')[0]}",
                                          replacement)
            # Check if the parameter is not present in cmd_value, then add it
            if f"-D{param_name}=" not in cmd_value:
                cmd_value += f" {replacement}"

    # Update the "cmd" value in the dictionary
    if job_type == "perfmeter":
        data["cmd"] = cmd_value
    else:
        data["GATLING_TEST_PARAMS"] = cmd_value

    return json.dumps(data)