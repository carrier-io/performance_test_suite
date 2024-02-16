from functools import partial

from flask import request
from flask_restful import Resource
from datetime import datetime
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
        request_args = request.args.to_dict(flat=True)
        results = []
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
            _res = requests_summary(connector)
            _res["name"] = backend_report["name"]
            _res["type"] = "backend"
            results.append(_res)
        for each in suite_report["tests"]["ui"]:
            _res = {}
            name, linechart_data, barchart_data = self.get_ui_charts_data(project_id, each)
            _res["linechart_data"] = linechart_data
            _res["barchart_data"] = barchart_data
            _res["name"] = name
            _res["type"] = "ui"
            results.append(_res)
        return results

    def get_ui_charts_data(self, project_id, report_id):
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

        barchart_data, names = [], []
        for each in results:
            if f"{each['name']}_{each['type']}" not in names:
                names.append(f"{each['name']}_{each['type']}")
                barchart_data.append({
                    "name": each['name'],
                    "type": each['type'],
                    "loops": {}
                })

        for page in barchart_data:
            for each in results:
                if each["name"] == page["name"]:
                    page["loops"][f"{each['loop']}"] = {
                        "load_time": each["load_time"],
                        "dom": each["dom"],
                        "tti": each["tti"],
                        "fcp": each["fcp"],
                        "lcp": each["lcp"],
                        "cls": each["cls"],
                        "tbt": each["tbt"],
                        "fvc": each["fvc"],
                        "lvc": each["lvc"]
                    }

        return report.name, linechart_data, barchart_data