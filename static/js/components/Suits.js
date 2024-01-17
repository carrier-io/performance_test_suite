const Suits = {
    props: ['instance_name'],
    components: {
        SuitSearch: SuitSearch,
        SuitModal: SuitModal,
        Locations: Locations,
        'input-stepper': InputStepper,
    },
    data() {
        return {
            allTest: [],
            cloud_settings: {},
            currentSuit: {
                uid: null,
                tests: [],
            },
        }
    },
    mounted() {
        this.fetchAllTests();
    },
    methods: {
        fetchAllTests() {
            Promise.all([
                ApiFetchBETests(),
                ApiFetchUITests(),
            ]).then((data) => {
                this.allTest = [
                    ...data[0].rows.map(row => ({ ...row, test_type: 'be'})),
                    ...data[1].rows.map(row => ({ ...row, test_type: 'ui', uid: row.test_uid }))
                ]
            });
        },
        deleteSuit(row) {

        },
        editSuit(row) {
            this.currentSuit = { ...row };
            this.$nextTick(() => {
                $('#suiteModal').modal('show');
            })
        },
        clearCurrentSuit() {
            this.currentSuit = {
                uid: null,
                tests: [],
            }
        }
    },
    template: `
        <div class="p-3">
            <div class="d-grid grid-column-2 gap-4">
                <div>
                    <Table-Card
                            @register="register"
                            instance_name="table_tests"
                            :adaptive-height="true"
                            :wide-table-row="true"
                            header='Suits'
                            :table_attributes="{
                                'data-page-size': 5,
                                id: 'tableSuit',
                                'data-side-pagination':'client',
                                'data-unique-id':'id',
                                'data-url':'/api/v1/performance_test_suite/suite/${getSelectedProjectId()}'
                            }"
                            container_classes="h-100"
                    >
                        <template #actions="{master}">
                            <div class="d-flex justify-content-end">
                                <button type="button" class="btn btn-basic btn-icon mr-2" data-toggle="modal"
                                        data-target="#suiteModal">
                                    <i class="icon__18x18 icon-create-element icon__white"></i>
                                </button>
                                <button type="button" class="btn btn-secondary btn-icon btn-icon__purple" id="delete_tests"><i
                                        class="icon__18x18 icon-delete"></i>
                                </button>
                            </div>
                        </template>
                        <template #table_headers>
                            <th scope="col" data-checkbox="true"></th>
                            <th data-visible="false" data-field="id">index</th>
                            <th scope="col" data-sortable="true"
                                data-field="name"
                            >
                                suite name
                            </th>
                            <th scope="col" data-sortable="true"
                                data-formatter="SuiteTable.suitTestFormatter"
                                data-field="tests"
                            >
                                tests
                            </th>
                            <th scope="col" data-sortable="true"
                                data-field="runner"
                            >
                                runner
                            </th>
                            <th scope="col" data-align="right"
                                data-formatter="SuiteTable.actions"
                                data-events="SuiteTable.action_events"
                            >
                                Actions
                            </th>
                        </template>
                    </Table-Card>
                </div>
                <div>
                    <Table-Card
                            @register="register"
                            instance_name="table_tests"
                            :adaptive-height="true"
                            :wide-table-row="true"
                            header='Thresholds'
                            :table_attributes="{
                                'data-page-size': 5,
                                id: 'tests-list',
                                'data-side-pagination':'client',
                                'data-unique-id':'id',
                            }"
                            container_classes="h-100"
                    >
                        <template #actions="{master}">
                            <div class="d-flex justify-content-end">
                                <button type="button" class="btn btn-basic btn-icon mr-2" data-toggle="modal"
                                        data-target="#{{ modal_id }}">
                                    <i class="icon__18x18 icon-create-element icon__white"></i>
                                </button>
                                <button type="button" class="btn btn-secondary btn-icon btn-icon__purple" id="delete_tests"><i
                                        class="icon__18x18 icon-delete"></i>
                                </button>
                            </div>
                        </template>
                        <template #table_headers>
                            <th scope="col" data-checkbox="true"></th>
                            <th data-visible="false" data-field="id">index</th>
                            <th scope="col" data-sortable="true"
                                data-field="name"
                            >
                                tests
                            </th>
                            <th scope="col" data-sortable="true"
                                data-field="entrypoint"
                            >
                                Entrypoint
                            </th>
                            <th scope="col" data-sortable="true"
                                data-field="job_type"
                            >
                                env.
                            </th>
                            <th scope="col" data-sortable="true"
                                data-field="job_type"
                            >
                                scope
                            </th>
                            <th scope="col" data-sortable="true"
                                data-field="job_type"
                            >
                                rule
                            </th>
                            <th scope="col" data-sortable="true"
                                data-field="job_type"
                            >
                                value
                            </th>
                            <th scope="col" data-align="right"
                            >
                                Actions
                            </th>
                        </template>
                    </Table-Card>
                </div>
            </div>
            <Table-Card
                    @register="register"
                    instance_name="table_results"
                    header='Reports'
                    :adaptive-height="true"
                    :table_attributes="{
                        id: 'results_table',
                        'data-side-pagination':'client',
                        'data-unique-id':'id',
                    }"
                    container_classes="mt-3"
            >
                <template #actions="{master}">
                    <div class="d-flex justify-content-end">
                        <button type="button" class="btn btn-secondary btn-icon btn-icon__purple" id="delete_results">
                            <i class="icon__18x18 icon-delete"></i>
                        </button>
                    </div>
                </template>
                <template #table_headers>
                    <th scope="col" data-checkbox="true"></th>
                    <th data-visible="false" data-field="id">index</th>
                    <th scope="col" data-sortable="true" data-field="name"
                        data-formatter=report_formatters.createLinkToTest>Name</th>
                    <th scope="col" data-sortable="true" data-field="start_time"
                        data-formatter="report_formatters.date_formatter">Start</th>
                    <th scope="col" data-sortable="true" data-field="duration">Duration</th>
                    <th scope="col" data-sortable="true" data-field="vusers">vUsers</th>
                    <th scope="col" data-sortable="true" data-field="environment">Env</th>
                    <th scope="col" data-sortable="true" data-field="type">Test Type</th>
                    <th scope="col" data-sortable="true" data-field="throughput">TPS</th>
                    <th scope="col" data-sortable="true" data-field="failure_rate">Fail Rate</th>
                    <th scope="col" data-sortable="true" data-field="tags">Tags</th>
                    <th scope="col" data-sortable="true" data-field="runner">Runner</th>
                    <th scope="col" data-sortable="true" data-field="test_status"
                        data-formatter="report_formatters.reportsStatusFormatter">Status
                    </th>
                </template>
            </Table-Card>
        </div>
        
        <SuitModal
            @register="$root.register"
            instance_name="suit_modal"
            @clear-current-suit="clearCurrentSuit"
            :current-suit="currentSuit"
            :all-test="allTest">
        </SuitModal>
    `
}

register_component('suits', Suits)