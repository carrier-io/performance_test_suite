const SuitResults = {
    props: ['instance_name', 'result'],
    components: {
        SuitCharts: SuitCharts,
        SuitMiniCharts: SuitMiniCharts,
    },
    data() {
        return {
            chartDataLoaded: false,
            initialLegends: [], // +
            initUiLegends: [], // +
            initBeLegends: [], // +
            selectedUiTests: [], // +
            selectedBeTests: [], // +
            summaryAllTests: {
                backend: [],
                ui: [],
            }, // +
        }
    },
    watch: {
        // chartDataLoaded(newVal, oldVal) {
        //     if (newVal) {
        //         this.$nextTick(() => {
        //             this.mountComponent();
        //         })
        //     }
        // },
    },
    methods: {
        mountComponent() {
            setTimeout(() => {
                this.createTestsTable()
            }, 500);
            const urlParams = new URLSearchParams(window.location.search);
            const resultId = urlParams.get('result_id');
            ApiSummaryData(resultId).then(data => {
                this.summaryAllTests = data;
                this.initialLegends.forEach(legend => {
                    this.summaryAllTests.ui.forEach(uiT => {
                        uiT.forEach(ds => {
                            if (`[${ds.simulation}] ${ds.identifier}` === legend.text) {
                                this.initUiLegends.push(legend.text);
                            }
                        })
                    });
                    this.summaryAllTests.backend.forEach(beT => {
                        beT.forEach(ds => {
                            if (`[${ds.simulation}] ${ds.request_name}` === legend.text) {
                                this.initBeLegends.push(legend.text);
                            }
                        })
                    })
                });
                this.selectedUiTests = this.summaryAllTests.ui.flat();
                this.selectedBeTests = this.summaryAllTests.backend.flat();
                $('#tableSummaryUi').bootstrapTable('load', this.selectedUiTests);
                $('#tableSummaryBe').bootstrapTable('load', this.selectedBeTests);
            })
            this.$nextTick(() => {
                const summaryTableBeId = '#collapse_summary_be';
                const summaryTableUiId = '#collapse_summary_ui';
                this.addRotateEvents(summaryTableBeId, 'show.bs.collapse', 'addClass');
                this.addRotateEvents(summaryTableBeId, 'hide.bs.collapse', 'removeClass');
                this.addRotateEvents(summaryTableUiId, 'show.bs.collapse', 'addClass')
                this.addRotateEvents(summaryTableUiId, 'hide.bs.collapse', 'removeClass');
            })
        },
        addRotateEvents(elementId, eventName, methodName) {
            $(elementId).on(eventName, () => {
                $(`[data-target='${elementId}'] i`)[methodName]('rotate-180')
            })
        },
        createTestsTable() {
            const tableData = [
                ...this.result.tests.backend.map(row => ({ ...row, test_type: 'backend'})),
                ...this.result.tests.ui.map(row => ({ ...row, test_type: 'ui'}))];
            $('#tableTests').bootstrapTable('load', tableData);
        },
        selectLegend(legends) {
            this.selectedUiTests = [];
            this.selectedBeTests = [];
            this.initUiLegends.forEach(legend => {
                if (legends.includes(legend)) {
                    this.summaryAllTests.ui.forEach(uiT => {
                        const uiTest = uiT.find(ds => {
                            return `[${ds.simulation}] ${ds.identifier}` === legend
                        })
                        this.selectedUiTests.push(uiTest)
                    })
                }
            });

            this.initBeLegends.forEach(legend => {
                if (legends.includes(legend)) {
                    this.summaryAllTests.backend.forEach(beT => {
                        const beTest = beT.find(ds => {
                            return `[${ds.simulation}] ${ds.request_name}` === legend
                        })
                        this.selectedBeTests.push(beTest)
                    })
                }
            });
            $('#tableSummaryUi').bootstrapTable('load', [...this.selectedUiTests]);
            $('#tableSummaryBe').bootstrapTable('load', [...this.selectedBeTests]);
        },
        initLegends(legends) {
            this.initialLegends = legends;
            this.$nextTick(() => {
                this.mountComponent();
            })
        },
    },
    computed: {
        dateFormatter() {
            const date1 = new Date(this.result.start_time);
            const date2 = new Date(this.result.end_time);
            const differenceInMilliseconds = Math.abs(date1 - date2);
            return (differenceInMilliseconds / 1000).toFixed(2);
        }
    },
    template: `
        <div class="p-3">
            <div class="card">
                <div class="p-28 pb-20">
                    <div class="d-flex justify-content-between">
                        <div class="d-flex align-items-center">
                            <a id="back-button" class="mr-2" href="javascript:history.back()">
                                <i class="icon__16x16 icon-arrow-left-bold__16"></i>
                            </a>
                            <p class="font-h3 font-bold">{{ result.name }} (back) </p>
                        </div>
                    </div>
                    <table class="mt-4">
                        <tr>
                            <td class="text-gray-500 font-h6 font-semibold font-uppercase pr-3">STARTED</td>
                            <td class="font-h5" id="start_time">{{ new Date(result.start_time).toLocaleString() }}</td>
                        </tr>
                        <tr>
                            <td class="text-gray-500 font-h6 font-semibold font-uppercase pr-3">DURATION</td>
                            <td class="font-h5" id="end_time font-h5">{{ dateFormatter }}</td>
                        </tr>
                    </table>
                </div>
                <div>
                    <hr class="my-0">
                    <div class="p-28 pt-3 d-flex gap-4">
                        <div>
                            <p class="mb-0 font-semibold" style="color: var(--gray);"><i class="fas fa-exclamation-circle"></i> Status description</p>
                            <p class="mb-0">{{ result.suite_status.status }}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="my-3">    
                <Table-Card
                    header='Tests'
                    :adaptive-height="true"
                    :borders="true"
                    :table_attributes="{
                        id: 'tableTests',
                        'data-pagination': 'true',
                        'data-page-list': '[5, 10, 15, 20]',
                        'data-page-size': 5,
                        'data-side-pagination': 'client',
                        'data-pagination-parts': ['pageInfo', 'pageList', 'pageSize']
                    }"
                    container_classes="mt-3 pb-20"
                >
                    <template #table_headers>
                        <th data-visible="false" data-field="id">index</th>
                        <th scope="col" data-sortable="true" data-field="name" data-formatter="SuiteTable.createLinkToOriginTest">Name</th>
                        <th scope="col" data-sortable="true" data-field="test_config.location">Location</th>
                        <th scope="col" data-sortable="true" data-field="test_type">GROUP</th>
                        <th scope="col" data-sortable="true" data-field="environment">ENV</th>
                        <th scope="col" data-sortable="true" data-field="failure_rate">ERROR RATE</th>
                        <th scope="col" data-sortable="true" data-field="duration">DURATION</th>
                        <th scope="col" data-sortable="true" data-field="test_status" data-formatter="SuiteTable.reportsStatusFormatter">STATUS</th>
                    </template>
                </Table-Card>
            </div>
            <SuitMiniCharts
                :tests="result.tests">
            </SuitMiniCharts>
            <div class="card p-28 mb-3">
                <SuitCharts
                    @is-chart-data-loaded="chartDataLoaded = true"
                    @init-legends="initLegends"
                    @select-legend="selectLegend">
                </SuitCharts>
            </div>
            <div class="mt-3 card p-3">
                <div data-toggle="collapse" data-target="#collapse_summary_be" role="button" aria-expanded="false" aria-controls="collapse_summary_be">
                    <div class="col">
                        <p class="font-h5 font-bold text-uppercase">Summary [BACKEND]
                            <button type="button" class="btn btn-nooutline-secondary p-0 pb-1 ml-1" data-toggle="collapse" data-target="#collapse_summary_be">
                                <i class="icon__16x16 icon-arrow-up__16 rotate-90"></i>
                            </button>
                        </p>
                    </div>
                </div>
                <div class="collapse" id="collapse_summary_be">
                    <div class="card-body pb-0 px-2">
                        <table
                            class="table table-border"
                            id="tableSummaryBe"
                            data-toggle="table"
                            data-unique-id="id"
                            data-page-list="[5, 10, 15, 20]"
                            data-page-size="5"
                            data-side-pagination="client"
                            data-pagination-parts="['pageInfo', 'pageList', 'pageSize']"
                            data-pagination="true">
                            <thead class="thead-light">
                                <tr>
                                    <th data-visible="false" data-field="id">index</th>
                                    <th scope="col" data-sortable="true" data-field="request_name" data-formatter="TableFormatter.summaryBeName">Name</th>
                                    <th scope="col" data-sortable="true" data-field="total">TTL REQ, COUNT</th>
                                    <th scope="col" data-sortable="true" data-field="throughput">THRGHPT, REQ/SEC</th>
                                    <th scope="col" data-sortable="true" data-field="ko">ERRORS, COUNT</th>
                                    <th scope="col" data-sortable="true" data-field="min">MIN, MS</th>
                                    <th scope="col" data-sortable="true" data-field="mean">MEDIAN, MS</th>
                                    <th scope="col" data-sortable="true" data-field="max">MAX, MS</th>
                                    <th scope="col" data-sortable="true" data-field="pct95">PCT95, MS</th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="mt-3 card p-3">
                <div data-toggle="collapse" data-target="#collapse_summary_ui" role="button" aria-expanded="false" aria-controls="collapse_summary_ui">
                    <div class="col">
                        <p class="font-h5 font-bold text-uppercase">Summary [UI]
                            <button type="button" class="btn btn-nooutline-secondary p-0 pb-1 ml-1" data-toggle="collapse" data-target="#collapse_summary_ui">
                                <i class="icon__16x16 icon-arrow-up__16 rotate-90"></i>
                            </button>
                        </p>
                    </div>
                </div>
                <div class="collapse" id="collapse_summary_ui">
                    <div class="card-body pb-0 px-2">
                        <table
                            class="table table-border"
                            id="tableSummaryUi"
                            data-toggle="table"
                            data-unique-id="id"
                            data-page-list="[5, 10, 15, 20]"
                            data-page-size="5"
                            data-side-pagination="client"
                            data-pagination-parts="['pageInfo', 'pageList', 'pageSize']"
                            data-pagination="true">
                            <thead class="thead-light">
                                <tr>
                                    <th data-visible="false" data-field="id">index</th>
                                    <th scope="col" data-sortable="true" data-field="name" data-formatter="TableFormatter.summaryUiName">Page name</th>
                                    <th scope="col" data-sortable="true" data-field="identifier">Identifier</th>
                                    <th scope="col" data-sortable="true" data-field="type">TYPE</th>
                                    <th scope="col" data-sortable="true" data-field="loop">loop</th>
                                    <th scope="col" data-sortable="true" data-field="load_time">load time</th>
                                    <th scope="col" data-sortable="true" data-field="report" data-formatter="TableFormatter.linkToUiReport">report</th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `
}

register_component('suit-results', SuitResults)