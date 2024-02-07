from functools import partial

from flask import request
from flask_restful import Resource

from pylon.core.tools import log
from tools import auth
from ....backend_performance.connectors.minio_connector import MinioConnector
from ....backend_performance.utils.charts_utils import requests_summary
from ...models.reports import SuiteReport


class API(Resource):
    url_params = [
        '<int:project_id>/<int:report_id>',
    ]

    statuses = ('finished', 'error', 'failed', 'success')


    def __init__(self, module):
        self.module = module

    #@auth.decorators.check_api(["performance.backend.reports.view"])
    def get(self, project_id: int, report_id: int):
        project = self.module.context.rpc_manager.call.project_get_or_404(
            project_id=project_id)
        results = []
        suite_report = SuiteReport.query.filter(
            SuiteReport.project_id == project_id,
            SuiteReport.id == report_id
        ).first().to_json()

        for each in suite_report["tests"]["backend"]:
            log.info("report for backend test")
            from ....backend_performance.models.reports import Report
            backend_report = Report.query.filter(
                Report.project_id == project_id,
                Report.id == each
            ).first().to_json()
            args = {'build_id': backend_report["build_id"],
                    'test_name': backend_report["name"],
                    'lg_type': backend_report["lg_type"],
                    'sampler': 'REQUEST',
                    'aggregator': 'auto',
                    'status': 'all',
                    'start_time': backend_report["start_time"],
                    'end_time': backend_report["end_time"],
                    'low_value': '0',
                    'high_value': '100'}
            connector = MinioConnector(**args)
            _res = requests_summary(connector)
            _res["name"] = backend_report["name"]
            _res["type"] = "backend"
            results.append(_res)
        for each in suite_report["tests"]["ui"]:
            log.info("report id for ui test")
            log.info(each)

        return results