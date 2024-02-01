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
            backend_reports, ui_reports = [], []
            for each in suite_data["tests"]["backend"]:
                from ...backend_performance.models.reports import Report
                test_report = Report.query.get_or_404(each).to_json()
                backend_reports.append(test_report)
            suite_data["tests"]["backend"] = backend_reports
            for each in suite_data["tests"]["ui"]:
                from ...ui_performance.models.ui_report import UIReport
                test_report = UIReport.query.get_or_404(each).to_json()
                ui_reports.append(test_report)
            suite_data["tests"]["ui"] = ui_reports

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
