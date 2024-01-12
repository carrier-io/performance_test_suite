const Suits = {
    components: {
        SuitSearch: SuitSearch,
        Locations: Locations,
        'input-stepper': InputStepper,
    },
    data() {
        return {
            allTest: [],
            selectedTests: [],
            showTestTable: false,
            suitName: '',
            suitEnv: '',
            suitType: '',
            needUpdateSearch: false,
            location: 'default',
            parallel_runners: 1,
            cpu_quota: 1,
            memory_quota: 4,
            cloud_settings: {},
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
                    ...data[1].rows.map(row => ({ ...row, test_type: 'ui'}))
                ]
            });
        },
        selectTests(selectPage) {
            this.selectedTests = [...selectPage];
        },
        addTests() {
            $('#allTests').bootstrapTable('refreshOptions', {
                columns: [
                    {
                        title: 'name',
                        field: 'name'
                    },
                    {
                        field: 'entrypoint',
                        title: 'entrypoint'
                    },
                    {
                        field: 'runner',
                        title: 'runner'
                    }
                ],
                data: this.selectedTests,
                detailView: true,
                detailFormatter: function(index, rowData) {
                    const container = document.createElement('div');
                    const app = Vue.createApp({
                        template: `
                            <div>
                                <div class="row mb-4 mt-2" data-toggle="collapse" data-target="#location_${rowData.uid}" role="button" aria-expanded="false" aria-controls="location_${rowData.uid}">
                                    <div class="col">
                                        <p class="font-h5 font-bold text-uppercase">LOAD CONFIGURAIONT
                                            <button type="button" class="btn btn-nooutline-secondary p-0 pb-1 ml-1" data-toggle="collapse" data-target="#location_${rowData.uid}">
                                                <i class="icon__16x16 icon-arrow-up__16 rotate-90"></i>
                                            </button>
                                        </p>
                                        <p class="font-h6 font-weight-400">Change engine regions and load profile. CPU Cores and Memory are distributed for each parallel test</p>
                                    </div>
                                </div>
                                <div class="collapse" id="location_${rowData.uid}">
                                    <div class="d-flex pb-4">
                                        <div class="custom-input w-100-imp displacement-ml-4">
                                            <p class="custom-input_desc font-semibold mb-1">Engine location</p>
                                            <select class="selectpicker bootstrap-select__b" data-style="btn">                                    >
                                                <optgroup label="Public pool">
                                                    <option v-for="item in ['default']">{{ item }}</option>
                                                </optgroup>
                                            </select>
                                        </div>
                                        <div class="custom-input ml-3">
                                            <p class="custom-input_desc font-semibold mb-1">Runners</p>
                                            <input-stepper 
                                                :default-value="${rowData.parallel_runners}"
                                                :uniq_id="modal_id + '_parallel'"
                                                @change="val => (parallel_runners_ = val)"
                                            ></input-stepper>
                                        </div>
                                        <div class="custom-input ml-3">
                                            <p class="custom-input_desc font-semibold mb-1">CPU Cores</p>
                                            <input-stepper 
                                                :default-value="${rowData.env_vars.cpu_quota}"
                                                :uniq_id="modal_id + '_cpu'"
                                                @change="val => (cpu_ = val)"
                                            ></input-stepper>
                                        </div>
                                        <div class="custom-input mx-3">
                                            <p class="custom-input_desc font-semibold mb-1">Memory, Gb</p>
                                            <input-stepper 
                                                :default-value="${rowData.env_vars.memory_quota}"
                                                :uniq_id="modal_id + '_memory'"
                                                @change="val => (memory_ = val)"
                                            ></input-stepper>
                                        </div>
                                    </div>
                                </div>
                                <div class="row mb-4" data-toggle="collapse" data-target="#params_${rowData.uid}" role="button" aria-expanded="false" aria-controls="params_${rowData.uid}">
                                    <div class="col">
                                        <p class="font-h5 font-bold text-uppercase">Test parameters
                                            <button type="button" class="btn btn-nooutline-secondary p-0 pb-1 ml-1" data-toggle="collapse" data-target="#params_${rowData.uid}">
                                                <i class="icon__16x16 icon-arrow-up__16 rotate-90"></i>
                                            </button>
                                        </p>
                                        <p class="font-h6 font-weight-400">You may also create additional parameters with ability to change them in subsequent test runs</p>
                                    </div>
                                </div>
                                <div class="collapse" id="params_${rowData.uid}">
                                    <div class="card-table-sm card mb-2" style="box-shadow: none">
                                        <table
                                            ref="test_params_${rowData.uid}"
                                            class="table table-transparent"
                                            id="test_params_${rowData.uid}"
                                            data-toggle="table">
                                            <thead class="thead-light">
                                            </thead>
                                            <tbody>
                                            </tbody>
                                        </table>
                                        <div class="mb-4">
                                            <button class="btn btn-secondary mt-2 d-flex align-items-center" @click="addParam">
                                                <i class="icon__18x18 icon-create-element mr-2"></i>
                                                Add parameter
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `,
                        data() {
                            return {
                                rowData: rowData,
                            };
                        },
                        components: {
                            'input-stepper': InputStepper,
                        },
                        mounted() {
                            $(this.$refs[`test_params_${rowData.uid}`]).bootstrapTable({
                                columns: [
                                    {
                                        title: 'name',
                                        field: 'name',
                                        formatter: (value, row, index, field) => ParamsTable.inputFormatter(value, row, index, field, `${rowData.uid}`),
                                        sortable: true,
                                    },
                                    {
                                        field: 'default',
                                        title: 'default Value',
                                        formatter: (value, row, index, field) => ParamsTable.inputFormatter(value, row, index, field, `${rowData.uid}`),
                                        sortable: true,
                                    },
                                    {
                                        field: 'description',
                                        title: 'description',
                                        formatter: (value, row, index, field) => ParamsTable.inputFormatter(value, row, index, field, `${rowData.uid}`),
                                        sortable: true,
                                    },
                                    {
                                        class: 'w-12',
                                        formatter: (value, row, index) => ParamsTable.deleteRowFormatter(value, row, index, `${rowData.uid}`),
                                    }
                                ],
                                data: rowData.test_parameters
                            });
                        },
                        methods: {
                            addParam() {
                                $(this.$refs[`test_params_${rowData.uid}`]).bootstrapTable('insertRow', {
                                    index: 0,
                                    row: {
                                        name: '',
                                        default: '',
                                        description: '',
                                    }
                                })
                            },
                        }
                    });
                    app.mount(container);
                    return container
                },
            });
            this.showTestTable = this.selectedTests.length > 0;
        },
        removeRow(i) {
            $('#allTests').bootstrapTable('remove', {
                field: '$index',
                values: [i]
            })
        },
        createSuit() {
            const tests = $('#allTests').bootstrapTable('getData');
            const newSuit = {
                "project_id": getSelectedProjectId(),
                "name": this.suitName,
                "env": this.suitEnv,
                "type": this.suitType,
                "tests": tests,
                "reporters": []
            }
            ApiCreateSuits(newSuit).then(() => {
                $('#tableSuit').bootstrapTable('refresh', { silent: true });
                this.suitName = ''
                this.suitEnv = ''
                this.suitType = ''
                this.selectedTests = []
                this.needUpdateSearch = true
                $('#allTests').bootstrapTable('load', [])
                $('#suiteModal').modal('hide');
                showNotify('SUCCESS', 'Suit created.');
                $('#tableSuit').bootstrapTable('refresh', { silent: true });
            }).finally(() => {
                this.needUpdateSearch = false;
            })
        },
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
                                data-formatter="ParamsTable.suitTestFormatter"
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
                                data-formatter="ParamsTable.deleteSuit"
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
                    <th scope="col" data-sortable="true" data-field="tags" data-formatter="ParamsTable.tagFormatter">Tags</th>
                    <th scope="col" data-sortable="true" data-field="runner">Runner</th>
                    <th scope="col" data-sortable="true" data-field="test_status"
                        data-formatter="report_formatters.reportsStatusFormatter">Status
                    </th>
                </template>
            </Table-Card>
        </div>

        <div class="modal fixed-left shadow-sm" tabindex="-1" role="dialog" id="suiteModal">
            <div class="modal-dialog modal-dialog-aside" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="row w-100">
                            <div class="col">
                                <h2>Create Suit</h2>
                            </div>
                            <div class="col-xs d-flex">
                                <button type="button" class="btn  btn-secondary" data-dismiss="modal" aria-label="Close">
                                    Cancel
                                </button>
                                <button type="button"
                                    @click="createSuit"
                                    class="btn btn-basic d-flex align-items-center ml-2"
                                >Save</button>
                                <button type="button"
                                    @click="createSuit"    
                                    class="btn btn-basic d-flex align-items-center ml-2"
                                >Save and Start</button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex">
                            <div style="width: 260px; margin-right: 50px;">
                                <p class="font-h5 text-uppercase font-bold mb-4">description</p>
                                <p class="font-h5 font-semibold mb-1">Suit name</p>
                                <div class="custom-input mb-2">
                                    <input type="text" 
                                        v-model="suitName"
                                        placeholder="Suit's name">
                                </div>
                                <p class="font-h5 font-semibold mb-1">Suit type</p>
                                <div class="custom-input mb-2">
                                    <input type="text" 
                                        v-model="suitType"
                                        placeholder="Suit's type">
                                </div>
                                <p class="font-h5 font-semibold mb-1">Suit enviroment</p>
                                <div class="custom-input mb-4">
                                    <input type="text" 
                                        v-model="suitEnv"
                                        placeholder="Suit's enviroment">
                                </div>
                                <p class="font-h5 text-uppercase font-bold mb-3">Summary</p>
                                <div class="px-2 py-1 d-flex border-b w-100 justify-content-between">
                                    <p class="font-h5 font-semibold">Tests</p>
                                    <p class="font-h5 font-semibold">-</p>
                                </div>
                                <div class="mb-2">
<!--                                    <p class="font-h5 font-weight-400 px-2 py-1 text-gray-700">Demo test</p>-->
<!--                                    <p class="font-h5 font-weight-400 px-2 py-1 text-gray-700">Lizard test</p>-->
<!--                                    <p class="font-h5 font-weight-400 px-2 py-1 text-gray-700">Ecommerce</p>-->
<!--                                    <p class="font-h5 font-weight-400 px-2 py-1 text-gray-700">Super test</p>-->
                                </div>
                                <div class="px-2 py-1 d-flex border-b w-100 justify-content-between">
                                    <p class="font-h5 font-semibold">Locations/Engines</p>
                                    <p class="font-h5 font-semibold">-</p>
                                </div>
<!--                                <div class="d-flex justify-content-between w-100 px-2 py-1">-->
<!--                                    <p class="font-h5 font-weight-400 text-gray-700">Carrier default config</p>-->
<!--                                    <p class="font-h5 font-weight-400 text-gray-700">2</p>-->
<!--                                </div>-->
<!--                                <div class="d-flex justify-content-between w-100 px-2 py-1">-->
<!--                                    <p class="font-h5 font-weight-400 text-gray-700">South America</p>-->
<!--                                    <p class="font-h5 font-weight-400 text-gray-700">3</p>-->
<!--                                </div>-->
<!--                                <div class="d-flex justify-content-between w-100 px-2 py-1">-->
<!--                                    <p class="font-h5 font-weight-400 text-gray-700">North America</p>-->
<!--                                    <p class="font-h5 font-weight-400 text-gray-700">2</p>-->
<!--                                </div>-->
<!--                                <div class="d-flex justify-content-between w-100 px-2 py-1">-->
<!--                                    <p class="font-h5 font-weight-400 text-gray-700">West Europe</p>-->
<!--                                    <p class="font-h5 font-weight-400 text-gray-700">2</p>-->
<!--                                </div>-->
                            </div>
                            <div class="w-100">
                                <p class="font-h5 text-uppercase font-bold mb-4">suit configuration</p>
                                <p class="font-h5 font-semibold mb-1">Tests</p>
                                <div class="d-flex mb-4">
                                    <SuitSearch
                                        v-if="allTest.length > 0"
                                        @select-items="selectTests"
                                        :is-all-checked="false"
                                        :key="needUpdateSearch"
                                        class="mr-2"
                                        :items-list="allTest">
                                    </SuitSearch>
                                    <button type="button" class="btn btn-lg btn-secondary" @click="addTests">
                                        Add tests
                                    </button>
                                </div>
                                <div class="card-table-sm card mb-4" style="box-shadow: none" v-show="showTestTable">
                                    <table
                                        class="table table-transparent"
                                        id="allTests"
                                        data-unique-id="uid"
                                        data-toggle="table">
                                        <thead class="thead-light">
                                            <tr>
                                                <th data-sortable="true" data-field="name">NAME</th>
                                                <th data-sortable="true" data-field="entrypoint">entrypoint</th>
                                                <th data-sortable="true" data-field="runner">runner</th>
                                                <th scope="col" data-align="right"
                                                    data-formatter=ParamsTable.actions
                                                    data-events="ParamsTable.action_events">Actions</th>      
                                            </tr>
                                        </thead>
                                        <tbody>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

register_component('suits', Suits)