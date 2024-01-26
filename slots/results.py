from pylon.core.tools import web, log  # pylint: disable=E0611,E0401
from tools import auth, theme  # pylint: disable=E0401
from ..models.reports import SuiteReport


class Slot:  # pylint: disable=E1101,R0903
    @web.slot('suite_results_content')
    # @auth.decorators.check_slot({
    #     "permissions": ["performance.backend_results"]
    # })
    def content(self, context, slot, payload):
        result_id = payload.request.args.get('result_id')
        if result_id:
            report = SuiteReport.query.get_or_404(result_id)
            # if not self.context.rpc_manager.call.admin_check_user_in_project(
            #         project_id=report.project_id,
            #         user_id=payload.auth.id
            # ):
            #     return theme.access_denied_part
            suite_data = report.to_json()
            # test_data["is_baseline_report"] = report.is_baseline_report
            # try:
            #     test_data["failure_rate"] = round((test_data["failures"] / test_data["total"]) * 100, 2)
            # except:
            #     test_data["failure_rate"] = 0
            #
            # connector = _get_connector(test_data)
            # test_data["samplers"] = connector.get_sampler_types()
            # test_data["aggregations"] = connector.get_aggregations_list()
            #
            # analytics_control = render_analytics_control(test_data["requests"])

            log.info(f"Suite_data === {suite_data}")
            with context.app.app_context():
                return self.descriptor.render_template(
                    'suite_results/content.html',
                    suite_data=suite_data
                )
        return theme.empty_content

    @web.slot('suite_results_scripts')
    def scripts(self, context, slot, payload):
        # log.info('slot: [%s], payload: %s', slot, payload)
        with context.app.app_context():
            return self.descriptor.render_template(
                'suite_results/scripts.html',
            )

    @web.slot('suite_results_styles')
    def styles(self, context, slot, payload):
        # log.info('slot: [%s], payload: %s', slot, payload)
        with context.app.app_context():
            return self.descriptor.render_template(
                'suite_results/styles.html',
            )
