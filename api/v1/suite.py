from sqlalchemy import and_
from flask import request
from flask_restful import Resource

from ...models.suite import Suite
from ...models.pd.suite import SuitePD

from tools import api_tools, auth
from pylon.core.tools import web, log
from pydantic import ValidationError


class API(Resource):
    url_params = [
        '<int:project_id>',
        '<int:project_id>/<int:suite_id>',
    ]

    def __init__(self, module):
        self.module = module

    def get(self, project_id: int):
        project = self.module.context.rpc_manager.call.project_get_or_404(
            project_id=project_id)
        total, res = api_tools.get(project_id, request.args, Suite)
        return {'total': total, 'rows': [i.to_json() for i in res]}, 200

    def post(self, project_id: int):
        project = self.module.context.rpc_manager.call.project_get_or_404(
            project_id=project_id)
        # TODO add validation
        try:
            pd_obj = SuitePD(**request.json)
        except ValidationError as e:
            return e.errors(), 400
        test_suite = Suite(**pd_obj.dict())
        test_suite.insert()
        return test_suite.to_json(), 201

    # def delete(self, project_id: int):
    #     project = self.module.context.rpc_manager.call.project_get_or_404(
    #         project_id=project_id)
    #     try:
    #         delete_ids = list(map(int, request.args["id[]"].split(',')))
    #     except TypeError:
    #         return 'IDs must be integers', 400
    #
    #     filter_ = and_(
    #         Threshold.project_id == project.id,
    #         Threshold.id.in_(delete_ids)
    #     )
    #     Threshold.query.filter(
    #         filter_
    #     ).delete()
    #     Threshold.commit()
    #     return {'ids': delete_ids}, 204

    # def put(self, project_id: int, threshold_id: int):
    #     project = self.module.context.rpc_manager.call.project_get_or_404(
    #         project_id=project_id)
    #     try:
    #         pd_obj = ThresholdPD(project_id=project_id, **request.json)
    #     except ValidationError as e:
    #         return e.errors(), 400
    #     th_query = Threshold.query.filter(
    #         Threshold.project_id == project_id,
    #         Threshold.id == threshold_id
    #     )
    #     th_query.update(pd_obj.dict())
    #     Threshold.commit()
    #     return th_query.one().to_json(), 200
