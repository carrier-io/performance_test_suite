from sqlalchemy import and_
from flask import request
from flask_restful import Resource

from ...models.reports import SuiteReport
from ...models.pd.suite import SuitePD

from tools import api_tools, auth
from pylon.core.tools import web, log
from pydantic import ValidationError


class API(Resource):
    url_params = [
        '<int:project_id>',
    ]

    def __init__(self, module):
        self.module = module

    def get(self, project_id: int):
        project = self.module.context.rpc_manager.call.project_get_or_404(
            project_id=project_id)
        total, res = api_tools.get(project_id, request.args, SuiteReport)
        # TODO extend with test results
        return {'total': total, 'rows': [i.to_json() for i in res]}, 200
