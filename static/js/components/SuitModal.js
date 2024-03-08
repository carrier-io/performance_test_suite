const SuitModal = {
    props: ['all-test', 'current-suit', 'modal-type'],
    components: {
        SuitSearch: SuitSearch,
    },
    data() {
        return {
            selectedTests: [],
            showTestTable: false,
            needUpdateSearch: false,
            location: 'default',
            parallel_runners: 1,
            cpu_quota: 1,
            memory_quota: 4,
            cloud_settings: {},
            editableSuit: {
                uid: null,
                name: '',
                env: '',
                type: '',
                tests: [],
            },
            suitsTestsList: [],
            suitsLocationsList: [],
            listLoc: {},
            applyClicked: false,
            isValidFilter: false,
        }
    },
    mounted() {
        $('#suiteModal').on('shown.bs.modal', (event) => {
            this.editableSuit = _.cloneDeep(this.currentSuit)
            if (this.currentSuit.uid) {
                this.editableSuit.tests = this.editableSuit.tests.map(test => {
                        if (test.uid) {
                            return test
                        } else {
                            return {...test, uid: test.test_uid}
                        }
                    }
                )
                this.suitsTestsList = this.editableSuit.tests.map(test => test.name);
                this.suitsLocationsList = this.editableSuit.tests.map(test => test.location);
                this.listLoc = this.suitsLocationsList.reduce((acc, elem) => {
                    acc[elem] = (acc[elem] || 0) + 1;
                    return acc;
                }, {})
                this.selectedTests = this.editableSuit.tests;
                this.addTests();
            }
        })
    },
    watch: {
        editableSuit: {
            handler: function (newVal, oldVal) {
                this.isValidFilter = !!newVal.name && !!newVal.env && !!newVal.type && !!newVal.tests.length;
            },
            deep: true,
        }
    },
    methods: {
        hasError(value) {
            return value.length > 0;
        },
        showError(value) {
            return this.applyClicked ? value.length > 0 : true;
        },
        apply() {
            this.applyClicked = true;
            if (!this.editableSuit.tests.length) showNotify('ERROR', 'Add Test.');
            if (this.isValidFilter) {
                if (this.modalType === 'run') {
                    this.run();
                } else {
                    this.createSuit();
                }
            }
        },
        addTests() {
            this.editableSuit.tests = [...this.selectedTests]
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
                                        <div class="custom-input w-100-imp">
                                            <p class="custom-input_desc font-semibold mb-1">Engine location</p>
                                            <select class="selectpicker bootstrap-select__b" data-style="btn"
                                                @change="event => changeLocationRegion(event)"
                                                id="location_region_${rowData.uid}">
                                                <optgroup label="Public pool" v-if="public_regions.length > 0">
                                                    <option v-for="item in public_regions">{{ item }}</option>
                                                </optgroup>
                                                <optgroup label="Project pool" v-if="project_regions.length > 0">
                                                    <option v-for="item in project_regions">{{ item }}</option>
                                                </optgroup>
                                                <optgroup label="Cloud pool" v-if="cloud_regions.length > 0">
                                                    <option v-for="item in cloud_regions">{{ item.name }}</option>
                                                </optgroup>
                                            </select>
                                            <div v-show="showCloudDetails">
                                                <p class="font-h5 font-semibold mt-2">Instance type</p>
                                                <div class="custom-input w-100-imp">
                                                    <select class="selectpicker bootstrap-select__b"
                                                        @change="event => changeLocationParam(event, 'cloud_settings', 'instance_type')"
                                                        id="instance_type_${rowData.uid}" data-style="btn">
                                                        <option value="spot">Spot instance</option>
                                                        <option value="on-demand">On-Demand instance</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="custom-input ml-3">
                                            <p class="custom-input_desc font-semibold mb-1">Runners</p>
                                            <input-stepper 
                                                :default-value="${rowData.parallel_runners}"
                                                :uniq_id="modal_id + '_parallel'"
                                                @change="event => changeLocationParam(event, 'parallel_runners')"
                                            ></input-stepper>
                                        </div>
                                        <div class="custom-input ml-3">
                                            <p class="custom-input_desc font-semibold mb-1">CPU Cores</p>
                                            <input-stepper 
                                                :default-value="${rowData.env_vars.cpu_quota}"
                                                :uniq_id="modal_id + '_cpu'"
                                                @change="event => changeLocationParam(event, 'cpu_quota')"
                                            ></input-stepper>
                                        </div>
                                        <div class="custom-input mx-3">
                                            <p class="custom-input_desc font-semibold mb-1">Memory, Gb</p>
                                            <input-stepper 
                                                :default-value="${rowData.env_vars.memory_quota}"
                                                :uniq_id="modal_id + '_memory'"
                                                @change="event => changeLocationParam(event, 'memory_quota')"
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
                                public_regions: [],
                                project_regions: [],
                                cloud_regions: [],
                                showCloudDetails: false,
                                aws_regions: [
                                    "eu-north-1",
                                    "ap-south-1",
                                    "eu-west-3",
                                    "eu-west-2",
                                    "eu-west-1",
                                    "ap-northeast-3",
                                    "ap-northeast-2",
                                    "me-south-1",
                                    "ap-northeast-1",
                                    "sa-east-1",
                                    "ca-central-1",
                                    "ap-east-1",
                                    "ap-southeast-1",
                                    "ap-southeast-2",
                                    "eu-central-1",
                                    "us-east-1",
                                    "us-east-2",
                                    "us-west-1",
                                    "us-west-2",
                                ],
                            };
                        },
                        components: {
                            'input-stepper': InputStepper,
                        },
                        mounted() {
                            this.public_regions = window.suitLocations.public_regions;
                            this.project_regions = window.suitLocations.project_regions;
                            this.cloud_regions = window.suitLocations.cloud_regions;
                            this.$nextTick(() => {
                                $(`#location_region_${this.rowData.uid}`).selectpicker('val', this.rowData.location);
                                $(`#location_region_${this.rowData.uid}`).selectpicker('render').selectpicker('refresh');
                                $(`#location_region_${this.rowData.uid}`).siblings('.dropdown-toggle').find('.filter-option-inner-inner').text(this.rowData.location);
                                if (Object.values(this.rowData.env_vars.cloud_settings).length > 0) {
                                    this.showCloudDetails = true;
                                    // $(`#aws_region_${rowData.uid}`).selectpicker('val', this.rowData.env_vars.cloud_settings.region_name);
                                    // $(`#aws_region_${rowData.uid}`).selectpicker('render').selectpicker('refresh');
                                    $(`#instance_type_${rowData.uid}`).selectpicker('val', this.rowData.env_vars.cloud_settings.instance_type );
                                    $(`#instance_type_${rowData.uid}`).selectpicker('render').selectpicker('refresh');
                                    // this.changeLocationParam(this.rowData.env_vars.cloud_settings.region_name, 'cloud_settings', 'region_name');
                                    if (this.rowData.env_vars.cloud_settings?.instance_type) this.changeLocationParam(this.rowData.env_vars.cloud_settings.instance_type, 'cloud_settings', 'instance_type');
                                }
                            })
                            $(this.$refs[`test_params_${rowData.uid}`]).bootstrapTable({
                                columns: [
                                    {
                                        title: 'name',
                                        field: 'name',
                                        formatter: (value, row, index, field) => TableFormatter.inputFormatter(value, row, index, field, `${rowData.uid}`),
                                        sortable: true,
                                    },
                                    {
                                        field: 'default',
                                        title: 'default Value',
                                        formatter: (value, row, index, field) => TableFormatter.inputFormatter(value, row, index, field, `${rowData.uid}`),
                                        sortable: true,
                                    },
                                    {
                                        field: 'description',
                                        title: 'description',
                                        formatter: (value, row, index, field) => TableFormatter.inputFormatter(value, row, index, field, `${rowData.uid}`),
                                        sortable: true,
                                    },
                                    {
                                        class: 'w-12',
                                        formatter: (value, row, index) => TableFormatter.deleteRowFormatter(value, row, index, `${rowData.uid}`),
                                    }
                                ],
                                data: rowData.test_parameters
                            });
                            this.$nextTick(() => {
                                const locationId = `#location_${this.rowData.uid}`;
                                const paramsId = `#params_${this.rowData.uid}`;
                                this.addRotateEvents(locationId, 'show.bs.collapse', 'addClass');
                                this.addRotateEvents(locationId, 'hide.bs.collapse', 'removeClass');
                                this.addRotateEvents(paramsId, 'show.bs.collapse', 'addClass')
                                this.addRotateEvents(paramsId, 'hide.bs.collapse', 'removeClass');
                            })
                        },
                        methods: {
                            addRotateEvents(elementId, eventName, methodName) {
                                $(elementId).on(eventName, () => {
                                    $(`[data-target='${elementId}'] i`)[methodName]('rotate-180')
                                })
                            },
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
                            changeLocationRegion(val) {
                                this.showCloudDetails = val.target.value.includes('aws');
                                if (this.showCloudDetails) {
                                    this.$nextTick(() => {
                                        $(`#instance_type_${rowData.uid}`).selectpicker('refresh');
                                        const selectedInt = this.cloud_regions.find(int => int.name === val.target.value);
                                        // $(`#aws_region_${rowData.uid}`).selectpicker('val', selectedInt.cloud_settings.region_name);
                                        // $(`#aws_region_${rowData.uid}`).selectpicker('refresh');
                                        // this.changeLocationParam(selectedInt.cloud_settings.region_name, 'cloud_settings', 'region_name');
                                        this.changeLocationParam(selectedInt.cloud_settings.instance_type, 'cloud_settings', 'instance_type');
                                    })
                                }
                                $('#allTests').bootstrapTable('updateCellByUniqueId', {
                                    id: this.rowData.uid,
                                    field: 'location',
                                    value: val.target.value,
                                    reinit: false
                                })
                            },
                            changeLocationParam(val, type, cloudField = null) {
                                let newValue = { ...this.rowData.env_vars, [type]: val };
                                if (type === 'cloud_settings' && !!val) {
                                    const value = typeof val === 'string' ? val : val.target.value
                                    newValue = { ...this.rowData.env_vars, cloud_settings: {
                                            ...this.rowData.env_vars.cloud_settings,
                                            [cloudField]: value
                                        }
                                    };
                                }
                                console.log(newValue)
                                $('#allTests').bootstrapTable('updateCellByUniqueId', {
                                    id: this.rowData.uid,
                                    field: 'env_vars',
                                    value: newValue,
                                    reinit: false
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
        selectTests(tests) {
            this.selectedTests = [...tests];
        },
        removeRow(i, row) {
            this.editableSuit.tests = this.editableSuit.tests.filter(test => test.uid !== row.uid)
            $('#allTests').bootstrapTable('remove', {
                field: '$index',
                values: [i]
            })
        },
        createSuit() {
            const tests = $('#allTests').bootstrapTable('getData');
            const newSuit = {
                "project_id": getSelectedProjectId(),
                "name": this.editableSuit.name,
                "env": this.editableSuit.env,
                "type": this.editableSuit.type,
                "tests": tests,
                "reporters": []
            }
            if (this.editableSuit.id) {
                ApiUpdateSuits(newSuit, this.editableSuit.id).then(() => {
                    $('#suiteModal').modal('hide');
                    showNotify('SUCCESS', 'Suite updated.');
                    $('#tableSuit').bootstrapTable('refresh', { silent: true });
                    this.resetData();
                })
            } else {
                ApiCreateSuits(newSuit).then(() => {
                    $('#suiteModal').modal('hide');
                    showNotify('SUCCESS', 'Suite created.');
                    $('#tableSuit').bootstrapTable('refresh', { silent: true });
                    this.resetData();
                })
            }
        },
        run() {
            const tests = $('#allTests').bootstrapTable('getData');
            const newSuit = {
                "project_id": getSelectedProjectId(),
                "name": this.editableSuit.name,
                "env": this.editableSuit.env,
                "type": this.editableSuit.type,
                "tests": tests,
                "reporters": []
            }
            ApiRunSuit(newSuit, this.editableSuit.id).then(() => {
                $('#suiteModal').modal('hide');
                showNotify('SUCCESS', 'Suite run.');
                $('#results_table').bootstrapTable('refresh', { silent: true });
                $('#tableSuit').bootstrapTable('refresh', { silent: true });
                this.resetData();
            })
        },
        closeModal(){
            this.resetData();
        },
        resetData() {
            this.selectedTests = []
            this.needUpdateSearch = true;
            this.applyClicked = false;
            $('#allTests').bootstrapTable('load', [])
            this.suitsTestsList = [];
            this.suitsLocationsList = [];
            this.listLoc = {};
            this.editableSuit =  {
                uid: null,
                name: '',
                env: '',
                type: '',
                tests: [],
            }
            this.$emit('clear-current-suit')
        }
    },
    template: `
        <div class="modal fixed-left shadow-sm" tabindex="-1" role="dialog" id="suiteModal" data-keyboard="false" data-backdrop="static">
            <div class="modal-dialog modal-dialog-aside" role="document">
                <div class="modal-content pb-0">
                    <div class="modal-header">
                        <div class="row w-100">
                            <div class="col">
                                <h2 class="text-capitalize">{{ modalType }} Suite</h2>
                            </div>
                            <div class="col-xs d-flex">
                                <button type="button" 
                                    @click="closeModal"
                                    class="btn  btn-secondary" data-dismiss="modal" aria-label="Close">
                                    Cancel
                                </button>
                                <button 
                                    v-if="modalType === 'run'"
                                    type="button"
                                    @click="apply"
                                    class="btn btn-basic d-flex align-items-center ml-2"
                                >Run</button>
                                <button v-else type="button"
                                    @click="apply"
                                    class="btn btn-basic d-flex align-items-center ml-2"
                                >Save</button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex">
                            <div style="width: 260px; margin-right: 50px;">
                                <p class="font-h5 text-uppercase font-bold mb-4">description</p>
                                <p class="font-h5 font-semibold mb-1">Suite name</p>
                                <div class="flex-grow-1 cell-input mb-2">
                                    <div class="custom-input need-validation" 
                                        :class="{'invalid-input': !showError(editableSuit.name)}"
                                        :data-valid="hasError(editableSuit.name)">
                                        <input
                                            type="text"
                                            :disabled="editableSuit.uid"
                                            v-model="editableSuit.name"
                                            placeholder="Suite's name">
                                        <span class="input_error-msg">Name is required!</span>
                                    </div>
                                </div>
                                <p class="font-h5 font-semibold mb-1">Suite type</p>
                                <div class="flex-grow-1 cell-input mb-2">
                                    <div class="custom-input need-validation" 
                                        :class="{'invalid-input': !showError(editableSuit.type)}"
                                        :data-valid="hasError(editableSuit.type)">
                                        <input
                                            type="text"
                                            v-model="editableSuit.type"
                                            placeholder="Suite's type">
                                        <span class="input_error-msg">Type is required!</span>
                                    </div>
                                </div>
                                <p class="font-h5 font-semibold mb-1">Suite enviroment</p>
                                <div class="flex-grow-1 cell-input mb-4">
                                    <div class="custom-input need-validation" 
                                        :class="{'invalid-input': !showError(editableSuit.env)}"
                                        :data-valid="hasError(editableSuit.env)">
                                        <input
                                            type="text"
                                            v-model="editableSuit.env"
                                            placeholder="Suite's enviroment">
                                        <span class="input_error-msg">Type is required!</span>
                                    </div>
                                </div>
                                <p class="font-h5 text-uppercase font-bold mb-3">Summary</p>
                                <div
                                    class="px-2 py-1 d-flex border-b w-100 justify-content-between">
                                    <p class="font-h5 font-semibold">Tests</p>
                                    <p class="font-h5 font-semibold">{{ suitsTestsList.length }}</p>
                                </div>
                                <div class="mb-2">
                                    <p 
                                        v-for="test in suitsTestsList" 
                                        class="font-h5 font-weight-400 px-2 py-1 text-gray-700">{{ test }}</p>
                                </div>
                                <div class="px-2 py-1 d-flex border-b w-100 justify-content-between">
                                    <p class="font-h5 font-semibold">Locations/Engines</p>
                                    <p class="font-h5 font-semibold">{{ suitsLocationsList.length }}</p>
                                </div>
                                <div 
                                    v-for="(count, location) in listLoc"
                                    class="d-flex justify-content-between w-100 px-2 py-1">
                                    <p class="font-h5 font-weight-400 text-gray-700">{{ location }}</p>
                                    <p class="font-h5 font-weight-400 text-gray-700">{{ count }}</p>
                                </div>
                            </div>
                            <div class="w-100">
                                <p class="font-h5 text-uppercase font-bold mb-4">suite configuration</p>
                                <p class="font-h5 font-semibold mb-1">Tests</p>
                                <div class="d-flex mb-4">
                                    <SuitSearch
                                        v-if="allTest.length > 0"
                                        @select-items="selectTests"
                                        :is-all-checked="false"
                                        :key="needUpdateSearch"
                                        class="mr-2"
                                        :items-list="allTest"
                                        :init-selected-item="editableSuit.tests">
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
                                                <th data-sortable="true" 
                                                    data-field="job_type"
                                                    data-formatter="TableFormatter.job_type">runner</th>
                                                <th scope="col" data-align="right"
                                                    data-formatter=TableFormatter.actions
                                                    data-events="TableFormatter.action_events">Actions</th>      
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
register_component('suit_modal', SuitModal)