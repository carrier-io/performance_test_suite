from queue import Empty
from sqlalchemy import and_

from pylon.core.tools import web, log  # pylint: disable=E0611,E0401
from tools import auth  # pylint: disable=E0401


class Slot:  # pylint: disable=E1101,R0903
    @web.slot('performance_test_suite_content')
    # @auth.decorators.check_slot({
    #     "permissions": ["performance.suite"]
    # })
    def content(self, context, slot, payload):
        project_id = context.rpc_manager.call.project_get_id()
        public_regions = context.rpc_manager.call.get_rabbit_queues("carrier", True)
        project_regions = context.rpc_manager.call.get_rabbit_queues(f"project_{project_id}_vhost")

        try:
            cloud_regions = context.rpc_manager.timeout(3).integrations_get_cloud_integrations(
                project_id)
        except Empty:
            cloud_regions = []
        locations = {
            'public_regions': public_regions,
            'project_regions': project_regions,
            "cloud_regions": cloud_regions
        }
        with context.app.app_context():
            return self.descriptor.render_template(
                'performance_test_suite/content.html',
                locations=locations
            )

    @web.slot('performance_test_suite_scripts')
    def scripts(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template(
                'performance_test_suite/scripts.html',
            )

    @web.slot('performance_test_suite_styles')
    def styles(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template(
                'performance_test_suite/styles.html',
            )
