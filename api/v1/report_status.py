from flask import request, make_response
from flask_restful import Resource
from datetime import datetime

from ...models.reports import SuiteReport
from tools import auth


class API(Resource):
    url_params = [
        '<int:project_id>/<int:report_id>',
    ]

    def __init__(self, module):
        self.module = module
        self.sio = self.module.context.sio

    # @auth.decorators.check_api({
    #     "permissions": ["performance.backend.reports.view"],
    #     "recommended_roles": {
    #         "default": {"admin": True, "editor": True, "viewer": True},
    #         "administration": {"admin": True, "editor": True, "viewer": True},
    #     }
    # })
    def get(self, project_id: int, report_id: int):
        project = self.module.context.rpc_manager.call.project_get_or_404(
            project_id=project_id)
        report = SuiteReport.query.filter_by(project_id=project.id, id=report_id).first()
        return {"message": report.test_status["status"]}

    # @auth.decorators.check_api({
    #     "permissions": ["performance.backend.reports.edit"],
    #     "recommended_roles": {
    #         "administration": {"admin": True, "editor": True, "viewer": True},
    #         "default": {"admin": True, "editor": True, "viewer": False},
    #     }
    # })
    def put(self, project_id: int, report_id: int):
        project = self.module.context.rpc_manager.call.project_get_or_404(
            project_id=project_id)
        report = SuiteReport.query.filter_by(project_id=project.id, id=report_id).first()
        test_status = request.json["test_status"]
        if test_status["status"] == "Failed":
            report.end_time = report.start_time
        report.suite_status = test_status
        report.end_time = datetime.utcnow().isoformat("T") + "Z"
        report.commit()
        self.sio.emit("test_suite_status_updated", {"status": test_status, 'report_id': report_id})

        return {"message": test_status["status"]}, 200
