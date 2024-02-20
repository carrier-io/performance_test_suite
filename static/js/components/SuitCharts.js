var lineChart
const SuitCharts = {
    components: {
        SuitTestDropdown: SuitTestDropdown
    },
    data() {
        lineChart: null
        return {
            initialData: null,
            legendList: [],
            selectedLegend: [],
            loading: false,
            pagesCount: 0,
            isShowDottedLine: true,
            labels: [],
            tests: [],
            selectedTests: [],
            valuesName: ['load_time', 'tti', 'fcp', 'dom', 'lcp', 'cls', 'tbt', 'fvc', 'lvc'],
            barColors: [
                '#5933C6',
                '#D463E7',
                '#29B8F5',
                '#F89033',
                '#D71616',
                '#18B64D',
                '#DBC714',
                '#7dda99',
                '#2963f5',
            ],
            metric: 'load_time',
        }
    },
    mounted() {
        const vm = this;
        $('#metric').on("changed.bs.select", function() {
            vm.metric = this.value;
        });
        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('result_id');
        this.loading = true;
        ApiChartData(resultId).then(data => {
            this.loading = false;
            this.tests = data;
            this.generateDatasets(data);
        })
    },
    watch: {
        metric(newValue, oldValue) {
            lineChart.destroy();
            lineChart = null;
            this.generateDatasets(this.tests)
        }
    },
    computed: {
        allTests() {
            if (this.tests.length) {
                return this.tests.map(t => t.name);
            } return []
        },
        isAllSelected() {
            return (this.selectedLegend.length < this.legendList.length) && this.selectedLegend.length > 0
        },
        isAllSelectCbxFilled() {
            return this.selectedLegend.length === this.legendList.length
        }
    },
    methods: {
        selectTest(tests) {
            this.selectedTests = this.tests.filter(t => tests.includes(t.name));
            // this.lineChart.destroy();
            lineChart.destroy();
            // this.lineChart = null;
            lineChart = null;
            this.generateDatasets(this.selectedTests)
        },
        convertDate(inputTime) {
            const parts = inputTime.split(/[- :]/);
            const dateTime = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]));
            const isoDateTime = dateTime.toISOString().replace(/\.\d{3}Z$/, 'Z');
            return isoDateTime;
        },
        generateDatasets(tests) {
            let beData = [];
            let uiData = [];
            const dottedDatasets = [];
            this.selectedLegend = [];
            tests.forEach(t => {
                if (t.type === 'backend') {
                    const ds = t.datasets.map(test => {
                        this.selectedLegend.push(`[${t.name}] ${test.label}`);
                        return {
                            backgroundColor: test.borderColor,
                            borderColor: test.borderColor,
                            label: `[${t.name}] ${test.label}`,
                            data: test.data.map((res, i) => {
                                return {
                                    y: res,
                                    x: t.labels[i],
                                }
                            }),
                            yAxisID: test.yAxisID,
                        }
                    })
                    beData = [...beData, ...ds];
                }
                if (t.type === 'ui') {
                    const formattedUiData = t['linechart_data'].map((page, index) => {
                        this.selectedLegend.push(`[${t.name}] ${page.name}`)
                        const ds = {
                            backgroundColor: this.barColors[index],
                            borderColor: this.barColors[index],
                            label: `[${t.name}] ${page.name}`,
                        };
                        const data = page.datasets[this.metric].map((value, i) => {
                            return {
                                y: value,
                                x: this.convertDate(page.labels[i]),
                            }
                        });
                        return {
                            ...ds,
                            data,
                        }
                    })
                    uiData.push(...formattedUiData);
                    dottedDatasets.push(...this.generateDottedDatasets(t));
                }
            });
            const preparedData = {
                datasets: [ ...beData, ...uiData, ...dottedDatasets],
            };
            this.drawCanvas(preparedData);
        },
        generateDottedDatasets(uiTest) {
            const countIndex = uiTest['linechart_data'][0].labels.length;
            const dottedData = [];

            for (let i = 0; i < countIndex; i++) {
                const data = [];
                uiTest['linechart_data'].forEach((page) => {
                    if (!this.selectedLegend.includes(`[${uiTest.name}] ${page.name}`)) return
                    data.push({
                        y: page.datasets[this.metric][i],
                        x: this.convertDate(page.labels[i]),
                    })
                })
                data.sort((a, b) => {
                    return new Date(b.x) - new Date(a.x);
                })
                dottedData.push({
                    borderDash: [10,5],
                    data,
                    label: `[${uiTest.name}] loop ${i}`
                })
            }
            return dottedData;
        },
        drawCanvas(datasets) {
            const ctx = document.getElementById("linechart");
            const chart = new Chart(ctx, {
                type: 'line',
                data: datasets,
                options: {
                    animation: false,
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            grid: {
                                display: true,
                            }
                        },
                        response_time: {
                            type: 'linear',
                            position: 'left',
                            beginAtZero: true,
                            display: true,
                            grid: {
                                display: true,
                                drawOnChartArea: true,
                                borderDash: [2, 1],
                                color: "#D3D3D3"
                            },
                        },
                        active_users: {
                            type: 'linear',
                            position: 'right',
                            beginAtZero: true,
                            min: 0,
                            grid: {
                                display: false,
                                drawOnChartArea: true,
                            },
                        }
                    }
                },
            });
            lineChart = chart;
            this.legendList = chart.options.plugins.legend.labels.generateLabels(chart).filter(l => {
                if (!l.text.includes('loop')) return l
            });
        },
        selectLegend(legend) {
            // let hidden = !this.lineChart.getDatasetMeta(legend.datasetIndex).hidden;
            let hidden = !lineChart.getDatasetMeta(legend.datasetIndex).hidden;
            this.selectedLegend = hidden
                ? this.selectedLegend.filter(lg => lg !== legend.text)
                : [...this.selectedLegend, legend.text];
            // this.lineChart.data.datasets.forEach((ds, i) => {
            //     if (this.lineChart.getDatasetMeta(legend.datasetIndex).label === ds.label) {
            //         this.lineChart.getDatasetMeta(i).hidden = hidden;
            //     }
            // })
            lineChart.data.datasets.forEach((ds, i) => {
                if (lineChart.getDatasetMeta(legend.datasetIndex).label === ds.label) {
                    lineChart.getDatasetMeta(i).hidden = hidden;
                }
            })
            this.combineDatasets();
            lineChart.update()
        },
        combineDatasets() {
            const dottedDatasets = [];
            this.selectedTests.forEach(t => {
                if (t.type === 'ui') {
                    dottedDatasets.push(...this.generateDottedDatasets(t));
                }
            });
            lineChart.data.datasets = [...lineChart.data.datasets.filter(ds => {
                if (!ds.label.includes('loop')) return ds;
            }),
                ...dottedDatasets];
            // this.lineChart.data.datasets.forEach((ds, i) => {
            //     if (i >= this.pagesCount) {
            //         this.lineChart.getDatasetMeta(i).hidden = !this.isShowDottedLine;
            //     }
            // })
        },
        selectAll({ target }) {
            const hidden = !target.checked;
            this.selectedLegend = hidden
                ? []
                : this.legendList.map(lg => lg.text)

            lineChart.data.datasets.forEach((ds, i) => {
                lineChart.getDatasetMeta(i).hidden = hidden;
                this.$refs['legendCbx'].forEach(cbx => {
                    cbx.checked = !hidden;
                })
            })
            if (!hidden) {
                this.combineDatasets();
            }
            lineChart.update()
        }
    },
    template: `
    
        <div class="d-flex align-items-center">
            <SuitTestDropdown
                v-if="allTests.length > 0"
                @select-items="selectTest"
                :is-all-checked="true"
                :items-list="allTests">
            </SuitTestDropdown>
            <div class="selectpicker-titled mr-2">
                <span class="font-h6 font-semibold px-3 item__left">METRIC</span>
                <select class="selectpicker" data-style="item__right" id="metric">
                    <option value="load_time">Load time</option>
                    <option value="dom">DOM Content Loading</option>
                    <option value="tti">Time To Interactive</option>
                    <option value="fcp">First Contentful Paint</option>
                    <option value="lcp">Largest Contentful Paint</option>
                    <option value="cls">Cumulative Layout Shift</option>
                    <option value="tbt">Total Blocking Time</option>
                    <option value="fvc">First Visual Change</option>
                    <option value="lvc">Last Visual Change</option>
                </select>
            </div>
            <div class="selectpicker-titled align-content-end" style="max-width: 220px">
                <span class="font-h6 font-semibold px-3 item__left text-uppercase">Time aggr.</span>
                <select class="selectpicker flex-grow-1" data-style="item__right">
                    <option value="1s">1s</option>
                    <option value="5s">5s</option>
                    <option value="30s">30s</option>
                    <option value="1m">1m</option>
                    <option value="5m">5m</option>
                    <option value="10m">10m</option>
                </select>
            </div>
        </div>
        <div class="d-flex mt-3">
            <div class="chart flex-grow-1" style="position: relative">
                <div 
                    v-if="loading"
                    class="layout-spinner">
                    <i class="spinner-loader__32x32 spinner-centered"></i>
                </div>
                <canvas id="linechart"></canvas>
            </div>
            <div class="card" style="width:280px; height: 500px; margin-left: 28px">
                <div class="d-flex flex-column p-3">
                    <label
                        class="mb-0 w-100 d-flex align-items-center custom-checkbox custom-checkbox__multicolor"
                        :class="{ 'custom-checkbox__minus': isAllSelected }"
                        for="all_checkbox">
                        <input
                            class="mx-2 custom__checkbox"
                            :checked="isAllSelectCbxFilled" id="all_checkbox"
                            style="--cbx-color: var(--basic);"
                            @change="selectAll"
                            type="checkbox">
                        <span class="w-100 d-inline-block">Select/Unselect all</span>
                    </label>
                </div>
                <hr class="my-0">
                <div id="linechart-group-legend"
                     class="custom-chart-legend d-flex flex-column px-3 py-3"
                     style="height: 400px; overflow: scroll;"
                >
                    <div v-for="(legend, index) in legendList" class="d-flex mb-3 float-left mr-3">
                        <label
                            class="mb-0 w-100 d-flex align-items-center custom-checkbox custom-checkbox__multicolor">
                            <input
                                class="mx-2 custom__checkbox"
                                checked="true"
                                ref="legendCbx"
                                @change="selectLegend(legend)"
                                :style="{'--cbx-color': legend.fillStyle}"
                                type="checkbox">
                            <span class="w-100 d-inline-block">{{ legend.text }}</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `
}