""" Module """
from queue import Empty

from pylon.core.tools import module, log  # pylint: disable=E0611,E0401

from .init_db import init_db

from tools import theme, shared


class Module(module.ModuleModel):
    """ Task module """

    def __init__(self, context, descriptor):
        self.context = context
        self.descriptor = descriptor

    def init(self):
        """ Init module """
        log.info('Initializing module')
        init_db()

        self.descriptor.init_api()

        self.descriptor.init_rpcs()

        self.descriptor.init_blueprint()

        try:
            theme.register_section(
                "performance",
                "Performance",
                kind="holder",
                location="left",
                permissions={
                    "permissions": ["performance"],
                    "recommended_roles": {
                        "administration": {"admin": True, "editor": True, "viewer": True},
                        "default": {"admin": True, "editor": True, "viewer": True},
                    }
                }
            )
        except:
            ...

        theme.register_subsection(
            "performance", "suite",
            "Suite",
            title="Performance test suite",
            kind="slot",
            prefix="performance_test_suite_",
            weight=4,
            # permissions={
            #     "permissions": ["performance.suite"],
            #     "recommended_roles": {
            #         "administration": {"admin": True, "editor": True, "viewer": True},
            #         "default": {"admin": True, "editor": True, "viewer": True},
            #     }
            # }
        )

        theme.register_page(
            "performance", "suite",
            "results",
            title="Test suite Results",
            kind="slot",
            prefix="suite_results_",
            # permissions={
            #     "permissions": ["performance.suite_results"],
            #     "recommended_roles": {
            #         "administration": {"admin": True, "editor": True, "viewer": True},
            #         "default": {"admin": True, "editor": True, "viewer": True},
            #     }
            # }
        )

        try:
            self.context.rpc_manager.timeout(3).integrations_register_section(
                name='Processing',
                integration_description='Manage processing',
                test_planner_description='Specify processing tools. You may also set processors in <a '
                                         'href="{}">Integrations</a> '.format(
                    '/-/configuration/integrations/')
            )

            self.context.rpc_manager.timeout(3).integrations_register(
                name='quality_gate',
                section='Processing',
            )
        except Empty:
            log.warning('No integrations plugin present')

        self.descriptor.init_slots()

        #shared.job_type_rpcs.add('performance_test_suite')

    def deinit(self):  # pylint: disable=R0201
        """ De-init module """
        log.info('De-initializing module')
