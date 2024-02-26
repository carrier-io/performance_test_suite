from functools import partial

from flask import request
from flask_restful import Resource
from datetime import datetime
from pylon.core.tools import log
from tools import auth
from ....backend_performance.connectors.minio_connector import MinioConnector
from ...models.reports import SuiteReport
from tools import api_tools


class API(Resource):
    url_params = [
        '<int:project_id>/<int:report_id>',
    ]


    def __init__(self, module):
        self.module = module

    def get(self, project_id: int, report_id: int):
        project = self.module.context.rpc_manager.call.project_get_or_404(
            project_id=project_id)
        request_args = request.args.to_dict(flat=True)
        results = {"backend": [], "ui": []}
        suite_report = SuiteReport.query.filter(
            SuiteReport.project_id == project_id,
            SuiteReport.id == report_id
        ).first().to_json()

        for each in suite_report["tests"]["backend"]:
            from ....backend_performance.models.reports import Report
            backend_report = Report.query.filter(
                Report.project_id == project_id,
                Report.id == each
            ).first().to_json()

            args = {'build_id': backend_report["build_id"],
                    'test_name': backend_report["name"],
                    'lg_type': backend_report["lg_type"],
                    'sampler': 'REQUEST',
                    'aggregator': request_args.get("aggregation", "auto"),
                    'status': 'all',
                    'start_time': backend_report["start_time"],
                    'end_time': backend_report["end_time"],
                    'low_value': '0',
                    'high_value': '100'}

            connector = MinioConnector(**args)
            _res = connector.get_build_data()
            if _res:
                results["backend"].append(_res)
        for each in suite_report["tests"]["ui"]:
            from ....ui_performance.models.ui_report import UIReport
            report = UIReport.query.filter_by(project_id=project_id,
                                              id=each).first().to_json()
            bucket = report["name"].replace("_", "").lower()
            file_name = f"{report['uid']}.csv.gz"
            s3_settings = report['test_config'].get(
                'integrations', {}).get('system', {}).get('s3_integration', {})
            _res = self.module.context.rpc_manager.call.get_ui_results(bucket=bucket, file_name=file_name,
                                             project_id=project_id, **s3_settings)
            if _res:
                for item in _res:
                    item["simulation"] = report["name"]
                    item[
                        "report"] = f"{api_tools.build_api_url('artifacts', 'artifact', mode='default')}/{project_id}/reports/{item['file_name']}",
                results["ui"].append(_res)
        return results
