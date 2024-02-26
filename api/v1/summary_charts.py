from functools import partial

from flask import request
from flask_restful import Resource
from datetime import datetime
from pylon.core.tools import log
from tools import auth
from ....backend_performance.connectors.minio_connector import MinioConnector
from ...models.reports import SuiteReport
from tools import api_tools
from ....backend_performance.utils.report_utils import chart_data


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
        results = {"throughput": [], "errors": [], "response_time": [], "ui": []}
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

            if backend_report["duration"] > 300:
                aggregator = "1m"
            else:
                aggregator = "30s"

            args = {'build_id': backend_report["build_id"],
                    'test_name': backend_report["name"],
                    'lg_type': backend_report["lg_type"],
                    'sampler': 'REQUEST',
                   # 'aggregator': request_args.get("aggregation", "auto"),
                    'aggregator': aggregator,
                    'status': 'all',
                    'start_time': backend_report["start_time"],
                    'end_time': backend_report["end_time"],
                    'low_value': '0',
                    'high_value': '100'}

            connector = MinioConnector(**args)

            # get tps chart
            timeline, _results, users  = connector.get_tps()
            _res = chart_data(timeline, None, _results, convert_time=False)
            _res["name"] = backend_report["name"]
            _res["report_id"] = backend_report["uid"]
            results["throughput"].append(_res)

            # get response time chart
            timeline, _results, users = connector.get_average_responses()
            _res = chart_data(timeline, None, _results, convert_time=False)
            _res["name"] = backend_report["name"]
            _res["report_id"] = backend_report["uid"]
            results["response_time"].append(_res)

            # get errors chart
            args["status"] = "ko"
            connector = MinioConnector(**args)
            timeline, _results, users = connector.get_tps()
            _res = chart_data(timeline, None, _results, convert_time=False)
            _res["name"] = backend_report["name"]
            _res["report_id"] = backend_report["uid"]
            results["errors"].append(_res)

        for each in suite_report["tests"]["ui"]:
            _res = {}
            name, report_id, dataset = self.get_ui_linechart_data(project_id, each)
            _res["dataset"] = dataset
            _res["name"] = name
            _res["report_id"] = report_id
            results["ui"].append(_res)
        return results


    def get_ui_linechart_data(self, project_id, report_id):
        from ....ui_performance.models.ui_report import UIReport
        report = UIReport.query.filter(
            UIReport.project_id == project_id,
            UIReport.id == report_id
        ).first()
        bucket = report.name.replace("_", "").lower()
        file_name = f"{report.uid}.csv.gz"
        s3_settings = report.test_config.get(
            'integrations', {}).get('system', {}).get('s3_integration', {})
        results = self.module.context.rpc_manager.call.get_ui_results(bucket=bucket, file_name=file_name,
                                             project_id=project_id, **s3_settings)
        linechart_data, names = [], []
        for each in results:
            if f"{each['name']}_{each['type']}" not in names:
                names.append(f"{each['name']}_{each['type']}")
                linechart_data.append({
                    "name": each['name'],
                    "type": each['type'],
                    "labels": [],
                    "datasets": {
                        "load_time": [],
                        "dom": [],
                        "tti": [],
                        "fcp": [],
                        "lcp": [],
                        "cls": [],
                        "tbt": [],
                        "fvc": [],
                        "lvc": []
                    }
                })
        for page in linechart_data:
            for each in results:
                if each["name"] == page["name"]:
                    page["labels"].append(
                        datetime.strptime(each["timestamp"].replace("+00:00", ""),
                                          "%Y-%m-%dT%H:%M:%S").strftime("%Y-%m-%d %H:%M:%S"))
                    for metric in ["load_time", "dom", "tti", "fcp", "lcp", "cls", "tbt",
                                   "fvc", "lvc"]:
                        page["datasets"][metric].append(each[metric])

        return report.name, report.uid, linechart_data