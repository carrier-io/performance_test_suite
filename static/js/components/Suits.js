const Suits = {
    components: {
        SuitSearch: SuitSearch,
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
        }
    },
    mounted() {
        this.fetchAllTests()
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
            $('#allTests').bootstrapTable('load', this.selectedTests);
            this.showTestTable = this.selectedTests.length > 0;
        },
        removeRow(i) {
            $('#allTests').bootstrapTable('remove', {
                field: '$index',
                values: [i]
            })
        },
        createSuit() {
            const newSuit = {
                "project_id": getSelectedProjectId(),
                "name": this.suitName,
                "env": this.suitEnv,
                "type": this.suitType,
                "tests": this.selectedTests,
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
                                        data-toggle="table">
                                        <thead class="thead-light">
                                            <tr>
                                                <th data-sortable="true" data-field="name">NAME</th>
                                                <th data-sortable="true" data-field="entrypoint">entrypoint</th>
                                                <th data-sortable="true" data-field="runner">runner</th>
                                                <th scope="col" data-align="right"
                                                    data-formatter=ParamsTable.actions
                                                    data-events="ParamsTable.action_events">Actions</th>                                            </tr>
                                        </thead>
                                        <tbody>
                                        </tbody>
                                    </table>
                                </div>
<!--                                <Locations-->
<!--                                    location=''-->
<!--                                    parallel_runners=''-->
<!--                                    cpu=''-->
<!--                                    memory=''-->
<!--                                    cloud_settings=''-->
<!--                                ></Locations>-->
<!--                                <div class="row mb-4" data-toggle="collapse" data-target="#advancedBackend" role="button" aria-expanded="false" aria-controls="advancedBackend">-->
<!--                                    <div class="col">-->
<!--                                        <p class="font-h5 font-bold text-uppercase">LOAD CONFIGURAIONT-->
<!--                                            <button type="button" class="btn btn-nooutline-secondary p-0 pb-1 ml-1" data-toggle="collapse" data-target="#advancedBackend">-->
<!--                                                <i class="icon__16x16 icon-arrow-up__16 rotate-90"></i>-->
<!--                                            </button>-->
<!--                                        </p>-->
<!--                                        <p class="font-h6 font-weight-400">Change engine regions and load profile. CPU Cores and Memory are distributed for each parallel test</p>-->
<!--                                    </div>-->
<!--                                </div>-->
<!--                                <div class="collapse" id="advancedBackend">-->
<!--                                    <div class="card-table-sm card" style="box-shadow: none">-->
<!--                                        <table-->
<!--                                            class="table table-transparent"-->
<!--                                            id="tests-list-dynamic1"-->
<!--                                            data-toggle="table"-->
<!--                                            data-unique-id="id"-->
<!--                                            data-data='{-->
<!--                                                "total": 2,-->
<!--                                                "rows": [-->
<!--                                                    {-->
<!--                                                        "id": 1,-->
<!--                                                        "engine_type": "String",-->
<!--                                                        "runners_type": 134,-->
<!--                                                        "cpu_type": "blue",-->
<!--                                                        "memory_size": "4000"-->
<!--                                                    },-->
<!--                                                    {-->
<!--                                                        "id": 2,-->
<!--                                                        "engine_type": "String",-->
<!--                                                        "runners_type": 134,-->
<!--                                                        "cpu_type": "red",-->
<!--                                                        "memory_size": "4000"-->
<!--                                                    }-->
<!--                                                ]-->
<!--                                            }'>-->
<!--                                            <thead class="thead-light">-->
<!--                                                <tr>-->
<!--                                                    <th data-sortable="true" data-field="engine_type" data-formatter="table_formatters.inputDefaultFormatter">NAME</th>-->
<!--                                                    <th data-sortable="true" data-field="runners_type" data-formatter="table_formatters.inputDefaultFormatter">DEFAULT VALUE</th>-->
<!--                                                    <th data-sortable="true" data-field="cpu_type" data-formatter="table_formatters.selectFormatter"-->
<!--                                                        data-values="tableColors">DESCRIPTION</th>-->
<!--                                                    <th data-align="right" data-cell-style="cellStyle" data-formatter=table_formatters.action></th>-->
<!--                                                </tr>-->
<!--                                            </thead>-->
<!--                                            <tbody>-->
<!--                                            </tbody>-->
<!--                                        </table>-->
<!--                                        <div class="mb-4">-->
<!--                                            <button class="btn btn-secondary mt-2 d-flex align-items-center" id="create-location">-->
<!--                                                <i class="icon__18x18 icon-create-element mr-2"></i>-->
<!--                                                Add Location-->
<!--                                            </button>-->
<!--                                        </div>-->
<!--                                    </div>-->
<!--                                </div>-->
<!--                                <div class="row mb-4" data-toggle="collapse" data-target="#advancedBackend2" role="button" aria-expanded="false" aria-controls="advancedBackend2">-->
<!--                                    <div class="col">-->
<!--                                        <p class="font-h5 font-bold text-uppercase">Thresholds-->
<!--                                            <button type="button" class="btn btn-nooutline-secondary p-0 pb-1 ml-1" data-toggle="collapse" data-target="#advancedBackend2">-->
<!--                                                <i class="icon__16x16 icon-arrow-up__16 rotate-90"></i>-->
<!--                                            </button>-->
<!--                                        </p>-->
<!--                                        <p class="font-h6 font-weight-400">Description</p>-->
<!--                                    </div>-->
<!--                                </div>-->
<!--                                <div class="collapse" id="advancedBackend2">-->
<!--                                    <div class="card-table-sm card" style="box-shadow: none">-->
<!--                                        <table-->
<!--                                                class="table table-transparent"-->
<!--                                                id="tests-list-dynamic1"-->
<!--                                                data-toggle="table"-->
<!--                                                data-unique-id="id"-->
<!--                                                data-data='{-->
<!--                                                "total": 2,-->
<!--                                                "rows": [-->
<!--                                                    {-->
<!--                                                        "id": 1,-->
<!--                                                        "engine_type": "String",-->
<!--                                                        "runners_type": 134,-->
<!--                                                        "cpu_type": "blue",-->
<!--                                                        "memory_size": "4000"-->
<!--                                                    },-->
<!--                                                    {-->
<!--                                                        "id": 2,-->
<!--                                                        "engine_type": "String",-->
<!--                                                        "runners_type": 134,-->
<!--                                                        "cpu_type": "red",-->
<!--                                                        "memory_size": "4000"-->
<!--                                                    }-->
<!--                                                ]-->
<!--                                            }'>-->
<!--                                            <thead class="thead-light">-->
<!--                                            <tr>-->
<!--                                                <th data-sortable="true" data-field="engine_type" data-formatter="table_formatters.inputDefaultFormatter">NAME</th>-->
<!--                                                <th data-sortable="true" data-field="runners_type" data-formatter="table_formatters.inputDefaultFormatter">DEFAULT VALUE</th>-->
<!--                                                <th data-sortable="true" data-field="cpu_type" data-formatter="table_formatters.selectFormatter"-->
<!--                                                    data-values="tableColors">DESCRIPTION</th>-->
<!--                                                <th data-align="right" data-cell-style="cellStyle" data-formatter=table_formatters.action></th>-->
<!--                                            </tr>-->
<!--                                            </thead>-->
<!--                                            <tbody>-->
<!--                                            </tbody>-->
<!--                                        </table>-->
<!--                                        <div class="mb-4">-->
<!--                                            <button class="btn btn-secondary mt-2 d-flex align-items-center" id="create-location">-->
<!--                                                <i class="icon__18x18 icon-create-element mr-2"></i>-->
<!--                                                Add Location-->
<!--                                            </button>-->
<!--                                        </div>-->
<!--                                    </div>-->
<!--                                </div>-->
<!--        -->
<!--                                <div class="row mb-4" data-toggle="collapse" data-target="#advancedBackend3" role="button" aria-expanded="false" aria-controls="advancedBackend3">-->
<!--                                    <div class="col">-->
<!--                                        <p class="font-h5 font-bold text-uppercase">Test parameters-->
<!--                                            <button type="button" class="btn btn-nooutline-secondary p-0 pb-1 ml-1" data-toggle="collapse" data-target="#advancedBackend3">-->
<!--                                                <i class="icon__16x16 icon-arrow-up__16 rotate-90"></i>-->
<!--                                            </button>-->
<!--                                        </p>-->
<!--                                        <p class="font-h6 font-weight-400">Description</p>-->
<!--                                    </div>-->
<!--                                </div>-->
<!--                                <div class="collapse" id="advancedBackend3">-->
<!--                                    <div class="card-table-sm card" style="box-shadow: none">-->
<!--                                        <table-->
<!--                                                class="table table-transparent"-->
<!--                                                id="tests-list-dynamic3"-->
<!--                                                data-toggle="table"-->
<!--                                                data-unique-id="id"-->
<!--                                                data-data='{-->
<!--                                                "total": 2,-->
<!--                                                "rows": [-->
<!--                                                    {-->
<!--                                                        "id": 1,-->
<!--                                                        "engine_type": "String",-->
<!--                                                        "runners_type": 134,-->
<!--                                                        "cpu_type": "blue",-->
<!--                                                        "memory_size": "4000"-->
<!--                                                    },-->
<!--                                                    {-->
<!--                                                        "id": 2,-->
<!--                                                        "engine_type": "String",-->
<!--                                                        "runners_type": 134,-->
<!--                                                        "cpu_type": "red",-->
<!--                                                        "memory_size": "4000"-->
<!--                                                    }-->
<!--                                                ]-->
<!--                                            }'>-->
<!--                                            <thead class="thead-light">-->
<!--                                            <tr>-->
<!--                                                <th data-sortable="true" data-field="engine_type" data-formatter="table_formatters.inputDefaultFormatter">NAME</th>-->
<!--                                                <th data-sortable="true" data-field="runners_type" data-formatter="table_formatters.inputDefaultFormatter">DEFAULT VALUE</th>-->
<!--                                                <th data-sortable="true" data-field="cpu_type" data-formatter="table_formatters.selectFormatter"-->
<!--                                                    data-values="tableColors">DESCRIPTION</th>-->
<!--                                                <th data-align="right" data-cell-style="cellStyle" data-formatter=table_formatters.action></th>-->
<!--                                            </tr>-->
<!--                                            </thead>-->
<!--                                            <tbody>-->
<!--                                            </tbody>-->
<!--                                        </table>-->
<!--                                        <div class="mb-4">-->
<!--                                            <button class="btn btn-secondary mt-2 d-flex align-items-center" id="create-location">-->
<!--                                                <i class="icon__18x18 icon-create-element mr-2"></i>-->
<!--                                                Add Location-->
<!--                                            </button>-->
<!--                                        </div>-->
<!--                                    </div>-->
<!--                                </div>-->
<!--        -->
<!--                                <div class="row mb-4">-->
<!--                                    <div class="col">-->
<!--                                        <p class="font-h5 font-bold text-uppercase">Reporting-->
<!--                                        </p>-->
<!--                                        <p class="font-h6 font-weight-400">Specify expected report types.</p>-->
<!--                                    </div>-->
<!--                                </div>-->
<!--                                <div class="d-grid grid-column-2 gap-50 grid-items-start mt-4"-->
<!--                                     id="backend_performance_system_section">-->
<!--                                    <div class="card card-row-1 card-x mx-auto">-->
<!--                                        <div class="card-header">-->
<!--                                            <div class="d-flex align-items-center"><p class="flex-grow-1 font-h5 font-semibold"-->
<!--                                                                                      style="line-height: 24px;">S3 Storage</p>-->
<!--                                                &lt;!&ndash;v-if&ndash;&gt;<label class="custom-toggle" data-toggle="false" data-placement="top"-->
<!--                                                                  title="No integrations found"><input aria-expanded="false"-->
<!--                                                                                                       type="checkbox"-->
<!--                                                                                                       data-target="#selector_s3_integration"-->
<!--                                                                                                       data-toggle="collapse"-->
<!--                                                                                                       class="collapsed"><span-->
<!--                                                        class="custom-toggle_slider round"></span></label></div>-->
<!--                                        </div>-->
<!--                                        <div>-->
<!--                                            <div class="pb-20 collapse" id="selector_s3_integration" style="">-->
<!--                                                <div><p class="font-h6 font-semibold mb-1">Integrated account</p>-->
<!--                                                    <div class="select-validation">-->
<!--                                                        <div class="dropdown bootstrap-select bootstrap-select__b">-->
<!--                                                            <select-->
<!--                                                                class="selectpicker bootstrap-select__b" data-style="btn"-->
<!--                                                                tabindex="-98">-->
<!--                                                                <option title="Carrier Minio - default" value="1#null">Carrier Minio-->
<!--                                                                    - default-->
<!--                                                                </option>-->
<!--                                                            </select>-->
<!--                                                        </div>-->
<!--                                                        <span class="select_error-msg"></span></div>-->
<!--                                                </div>-->
<!--                                                <div class="security_integration_item" data-name="s3-integration-toggle"></div>-->
<!--                                            </div>-->
<!--                                        </div>-->
<!--                                        <div class="row">-->
<!--                                            <div class="collapse col-12 mb-3 pl-0" id="settings_s3_integration"></div>-->
<!--                                        </div>-->
<!--                                    </div>-->
<!--                                </div>-->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

register_component('suits', Suits)