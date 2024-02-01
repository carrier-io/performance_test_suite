from queue import Empty
from typing import Union

from flask import request
from flask_restful import Resource
from pylon.core.tools import log

from tools import auth
from ...models.suite import Suite
from ...utils.utils import run_suite


class API(Resource):
    url_params = [
        '<int:project_id>/<int:suite_id>',
        '<int:project_id>/<string:suite_id>',
    ]

    def __init__(self, module):
        self.module = module


    def post(self, project_id: int, suite_id: Union[int, str]):
        """ Run suite with possible overridden params """
        config_only_flag = request.json.pop('type', False)
        execution_flag = request.json.pop('execution', True)
        engagement_id = request.json.get('integrations', {}).get('reporters', {}) \
            .get('reporter_engagement', {}).get('id')

        suite = Suite.query.filter(
            Suite.project_id == project_id,
            Suite.id == suite_id
        ).first().to_json()

        suite["tests"] = request.json.get("tests")

        resp = run_suite(suite, project_id, config_only=config_only_flag, execution=execution_flag,
                        engagement_id=engagement_id)
        #return resp, resp.get('code', 200)
        return resp, 200
