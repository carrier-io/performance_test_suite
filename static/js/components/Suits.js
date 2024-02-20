const Suits = {
    props: ['instance_name', 'locations'],
    components: {
        SuitSearch: SuitSearch,
        SuitModal: SuitModal,
        Locations: Locations,
        SuitConfirmModal: SuitConfirmModal,
        'input-stepper': InputStepper,
    },
    data() {
        return {
            allTest: [],
            cloud_settings: {},
            currentSuit: {
                uid: null,
                name: '',
                env: '',
                type: '',
                tests: [],
            },
            showConfirm: false,
            preparedDeletingIds: [],
            modalType: null,
            deletingTitle: null,
            loadingDelete: false,
        }
    },
    mounted() {
        this.fetchAllTests();
        $('#delete_suits').on('click', e => {
            const ids_to_delete = $('#tableSuit').bootstrapTable('getSelections').map(
                item => item.id
            );
            this.preparedDeletingIds = ids_to_delete;
            this.deletingTitle = 'suite';
            ids_to_delete.length && this.openConfirm();
        });
        $('#delete_results').on('click', e => {
            const ids_to_delete = $('#results_table').bootstrapTable('getSelections').map(
                item => item.id
            );
            this.preparedDeletingIds = ids_to_delete;
            this.deletingTitle = 'report';
            ids_to_delete.length && this.openConfirm();
        })
        socket.on("test_suite_status_updated", data => {
            $('#results_table').bootstrapTable('updateByUniqueId', {
                id: data['report_id'],
                row: {
                    'suite_status': data['status']
                }
            })
        })
        socket.on("test_suite_finished", data => {
            $('#results_table').bootstrapTable('updateByUniqueId', {
                id: data['id'],
                row: {
                    'suite_status': data['status']
                }
            })
        })
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
        openConfirm() {
            this.showConfirm = !this.showConfirm;
        },
        deleteSuit() {
            this.loadingDelete = true;
            ApiDeleteSuit(this.preparedDeletingIds).then(res => {
                showNotify('SUCCESS', 'Suite deleted.');
                this.openConfirm();
                $('#tableSuit').bootstrapTable('refresh', { silent: true });
            }).finally(() => {
                this.loadingDelete = false;
            })
        },
        editSuit(row, modalType) {
            this.modalType = modalType;
            this.currentSuit = _.cloneDeep(row);
            this.$nextTick(() => {
                $('#suiteModal').modal('show');
            })
        },
        deleteReport() {
            this.loadingDelete = true;
            ApiDeleteReport(this.preparedDeletingIds).then(res => {
                showNotify('SUCCESS', 'Report deleted.');
                this.openConfirm();
                $('#results_table').bootstrapTable('refresh', { silent: true });
            }).finally(() => {
                this.loadingDelete = false;
            })
        },
        clearCurrentSuit() {
            this.currentSuit = {
                uid: null,
                name: '',
                env: '',
                type: '',
                tests: [],
            }
        },
        deleteItems(title) {
            title === 'suite' ? this.deleteSuit() : this.deleteReport()
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
                        header='Suites'
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
                                        @click="modalType = 'edit'"
                                        data-target="#suiteModal">
                                    <i class="icon__18x18 icon-create-element icon__white"></i>
                                </button>
                                <button type="button" class="btn btn-secondary btn-icon btn-icon__purple" id="delete_suits"><i
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
                                data-field="tests"
                                data-formatter="SuiteTable.job_type"
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
                    instance_name="results_table"
                    header='Reports'
                    :adaptive-height="true"
                    :table_attributes="{
                        id: 'results_table',
                        'data-side-pagination':'client',
                        'data-unique-id':'id',
                        'data-url':'/api/v1/performance_test_suite/reports/${getSelectedProjectId()}'
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
                        data-formatter=SuiteTable.createLinkToTest>Name</th>
                    <th scope="col" data-sortable="true" data-field="start_time"
                        data-formatter="SuiteTable.date_formatter">Start</th>
                    <th scope="col" data-sortable="true" data-field="duration"
                        data-formatter="SuiteTable.duration_formatter">Duration</th>
                    <th scope="col" data-sortable="true" data-field="environment">Env</th>
                    <th scope="col" data-sortable="true" data-field="type">Test Type</th>
                    <th scope="col" data-sortable="true" data-field="tags">Tags</th>
                    <th scope="col" data-sortable="true" data-field="suite_status"
                        data-formatter="SuiteTable.reportsStatusFormatter">Status
                    </th>
                </template>
            </Table-Card>
        </div>
        <SuitModal
            @register="$root.register"
            instance_name="suit_modal"
            @clear-current-suit="clearCurrentSuit"
            :current-suit="currentSuit"
            :modal-type="modalType"
            :all-test="allTest">
        </SuitModal>
        <Transition>
            <SuitConfirmModal
                v-if="showConfirm"
                @close-confirm="openConfirm"
                :title="deletingTitle"
                :loading-delete="loadingDelete"
                @delete-items="deleteItems">
            </SuitConfirmModal>
        </Transition>
    `
}

register_component('suits', Suits)