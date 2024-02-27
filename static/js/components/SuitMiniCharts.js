const SuitMiniCharts = {
    props: ['tests'],
    components: {
        SuitTestDropdown: SuitTestDropdown,
        TextToggle: TextToggle,
    },
    data() {
        return {
            selectedTests: this.tests,
            selectedTestsByTime: [],
            chartIds: ['throughputChart', 'errorRateChart', 'responseTimeChart', 'pageSpeedChart'],
            metric: ['load_time', 'load_time'],
            valuesFullName: {
                load_time: ['load_time', 'load_time'],
                tti: ['tti', 'time_to_interactive'],
                fcp: ['fcp', 'first_contentful_paint'],
                dom: ['dom', 'dom_content_loading'], // dom
                lcp: ['lcp', 'largest_contentful_paint'],
                cls: ['cls', 'last_visual_change'], // 'cls',
                tbt: ['tbt', 'total_blocking_time'],
                fvc: ['fvc', 'first_visual_change'],
                lvc: ['lvc', 'last_visual_change'],
            },
            valuesName: ['load_time', 'tti', 'fcp', 'dom', 'lcp', 'cls', 'tbt', 'fvc', 'lvc'],
            valuesTimeName: ['errors', 'response_time', 'throughput', 'ui'],
            metricBE: 'pct95',
            axis_type: 'categorical',
            chartTimeData: null,
            loadingChartTime: true,
        }
    },
    mounted() {
        const vm = this;
        $('#metricMini').on("changed.bs.select", function() {
            vm.metric = vm.valuesFullName[this.value];
        });
        $('#metricAggregation').on("changed.bs.select", function() {
            vm.metricBE = this.value;
            window['responseTimeChart'].destroy();
            window['responseTimeChart'] = null;
            vm.drawChart('backend','responseTimeChart', this.value, 'ms', `RESPONSE TIME - ${this.value}`);
        });
        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('result_id');
        ApiChartTimeData(resultId).then(data => {
            this.loadingChartTime = false;
            this.chartTimeData = data;
            this.selectedTestsByTime = data;
        })
        this.generateChartOptions()
    },
    watch: {
        metric(newValue, oldValue) {
            if (this.axis_type === 'time') {
                window['pageSpeedChart'].destroy();
                window['pageSpeedChart'] = null;
                this.drawTimeChart('ui', 'pageSpeedChart', 'ui', 'ms', 'PAGE SPEED');
            } else {
                window['pageSpeedChart'].destroy();
                window['pageSpeedChart'] = null;
                this.drawChart('ui', 'pageSpeedChart', newValue[1], 'ms', `PAGE SPEED`);
            }
        },
        axis_type(newVal) {
            this.$nextTick(() => {
                $('#metricAggregation').selectpicker('refresh');
            })
            if (newVal === 'time') {
                this.chartIds.forEach(id => {
                    if (window[id]) {
                        window[id].destroy();
                        window[id] = null;
                    }
                })
                this.generateChartTimeOptions();
            } else {
                this.chartIds.forEach(id => {
                    if (window[id]) {
                        window[id].destroy();
                        window[id] = null;
                    }
                })
                this.generateChartOptions();
            }
        }
    },
    computed: {
        allTests() {
            const tests = [
                ...this.tests.backend.map(test => test.name),
                ...this.tests.ui.map(test => test.name)];
            if (tests.length) {
                return tests;
            } return []
        },
    },
    methods: {
        generateChartOptions() {
            this.drawChart('backend', 'throughputChart', 'throughput', 'req/sec', 'AVG. THROUGHPUT');
            this.drawChart('backend', 'errorRateChart', 'failure_rate', '%', 'ERROR RATE');
            this.drawChart('backend','responseTimeChart', 'pct95', 'ms', 'RESPONSE TIME - pct95');
            this.drawChart('ui', 'pageSpeedChart', 'load_time', 'ms', 'PAGE SPEED - load time');
        },
        generateChartTimeOptions(data) {
            this.drawTimeChart('backend', 'throughputChart', 'throughput', 'req/sec', 'AVG. THROUGHPUT');
            this.drawTimeChart('backend', 'errorRateChart', 'errors', '%', 'ERROR RATE');
            this.drawTimeChart('backend','responseTimeChart', 'response_time', 'ms', 'RESPONSE TIME');
            this.drawTimeChart('ui', 'pageSpeedChart', 'ui', 'ms', 'PAGE SPEED');
        },
        drawChart(testType, chartId, keyName, yAxisTitle, chartTitle) {
            if (testType === 'backend') {
                const datasets = []
                const data = this.selectedTests[testType].map(test => {
                    return {
                        x: test.name,
                        y: test[keyName],
                    }
                });
                datasets.push({
                    data: data,
                    borderColor: '#5933c6',
                    tension: 0.1,
                    backgroundColor: '#5933c6',
                    borderWidth: 1,
                    pointRadius: 1,
                    pointHoverRadius: 2,
                })
                window[chartId] = new Chart(chartId, {
                    type: 'line',
                    data: {
                        datasets: datasets,
                    },
                    options: {
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                type: 'linear',
                                title: {
                                    display: true,
                                    text: yAxisTitle,
                                },
                                grid: {
                                    display: false
                                },
                                display: 'auto'
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                            }
                        },
                        plugins: {
                            legend: {
                                display: false,
                            },
                            title: {
                                display: true,
                                align: 'start',
                                fullSize: false,
                                text: chartTitle,
                            },
                        },
                    }
                })
            } else {
                const datasets = []
                const labels = this.selectedTests[testType].map((test) => test.name)
                const colors = ['#28a745', '#5933c6', '#e97912'];
                const sizes = ['min', 'mean', 'max'];

                const allValues = []
                sizes.forEach((size, index) => {
                    const data = this.selectedTests[testType].map((test) => test[keyName][size]);
                    allValues.push(...data)
                    datasets.push({
                        label: size,
                        data: data,
                        borderColor: colors[index],
                        backgroundColor: colors[index],
                        borderWidth: 1,
                        pointRadius: 1,
                        pointHoverRadius: 2,
                        snapGaps: true,
                        fill: '+1',
                        tension: 0.4,
                    })
                })
                window[chartId] = new Chart(chartId, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: datasets,
                    },
                    options: {
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        stacked: false,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                type: 'linear',
                                grid: {
                                    display: false
                                },
                                title: {
                                    display: true,
                                    text: yAxisTitle,
                                },
                                display: true,
                                beginAtZero: true,
                            },
                        },
                        plugins: {
                            legend: {
                                display: false,
                            },
                            title: {
                                display: true,
                                align: 'start',
                                fullSize: false,
                                text: chartTitle
                            }
                        },
                    }
                })
            }
        },
        drawTimeChart(testType, chartId, keyName, yAxisTitle, chartTitle) {
            if (testType === 'backend') {
                const nds = []
                this.selectedTestsByTime[keyName].forEach((test) => {
                    const formattedDs = {
                        backgroundColor: test.datasets[0].backgroundColor,
                        borderColor: test.datasets[0].borderColor,
                        borderWidth: test.datasets[0].borderWidth,
                        fill: test.datasets[0].fill,
                        label: test.datasets[0].label + ' ' + test.name,
                        lineTension: test.datasets[0].lineTension,
                        pointRadius: test.datasets[0].pointRadius,
                        spanGaps: test.datasets[0].spanGaps,
                        data: test.datasets[0].data.map((ds, index) => ({
                            x: test.labels[index],
                            y: ds,
                        })) }
                    nds.push(formattedDs);
                })
                window[chartId] = new Chart(chartId, {
                    type: 'line',
                    data: {
                        datasets: nds
                    },
                    options: {
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                type: 'time',
                                grid: {
                                    display: false
                                },
                            },
                            y: {
                                type: 'linear',
                                title: {
                                    display: true,
                                    text: yAxisTitle,
                                },
                                grid: {
                                    display: false
                                },
                                display: 'auto'
                            },
                        },
                        plugins: {
                            legend: {
                                display: false,
                            },
                            title: {
                                display: true,
                                align: 'start',
                                fullSize: false,
                                text: chartTitle,
                            },
                        },
                    }
                })
            } else {
                const dynamicColors = function() {
                    const r = Math.floor(Math.random() * 255);
                    const g = Math.floor(Math.random() * 255);
                    const b = Math.floor(Math.random() * 255);
                    return "rgb(" + r + "," + g + "," + b + ")";
                };
                const nds = []
                this.selectedTestsByTime[keyName].forEach((test) => {
                    const datasets = test.dataset.map(page => {
                        return {
                            label: `[${test.name}] ${page.name}`,
                            backgroundColor: dynamicColors(),
                            borderColor: dynamicColors(),
                            borderWidth: 1,
                            pointRadius: 1,
                            data: page.datasets[this.metric[0]].map((ds, index) => ({
                                x: page.labels[index],
                                y: ds,
                            }))
                        }
                    })
                    nds.push(datasets)
                })
                window[chartId] = new Chart(chartId, {
                    type: 'line',
                    data: {
                        datasets: nds[0]
                    },
                    options: {
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                type: 'time',
                                grid: {
                                    display: false
                                },
                            },
                            y: {
                                type: 'linear',
                                title: {
                                    display: true,
                                    text: yAxisTitle,
                                },
                                grid: {
                                    display: false
                                },
                                display: 'auto'
                            },
                        },
                        plugins: {
                            legend: {
                                display: false,
                            },
                            title: {
                                display: true,
                                align: 'start',
                                fullSize: false,
                                text: chartTitle,
                            },
                        },
                    }
                })
            }
        },
        selectTest(tests) {
            this.selectedTests = {
                backend: this.tests.backend.filter(t => tests.includes(t.name)),
                ui: this.tests.ui.filter(t => tests.includes(t.name)),
            }
            this.selectedTestsByTime = {
                errors: this.chartTimeData.errors.filter(t => tests.includes(t.name)),
                response_time: this.chartTimeData.response_time.filter(t => tests.includes(t.name)),
                throughput: this.chartTimeData.throughput.filter(t => tests.includes(t.name)),
                ui: this.chartTimeData.ui.filter(t => tests.includes(t.name)),
            }
            if (this.axis_type === 'time') {
                this.chartIds.forEach(id => {
                    if (window[id]) {
                        window[id].destroy();
                        window[id] = null;
                    }
                })
                this.generateChartTimeOptions();
            } else {
                this.chartIds.forEach(id => {
                    window[id].destroy();
                    window[id] = null;
                })
                this.generateChartOptions();
            }
        },
    },
    template: `
    <div class="card p-28 mb-3">
    <div class="d-flex">
        <SuitTestDropdown
            v-if="allTests.length > 0"
            @select-items="selectTest"
            :is-all-checked="true"
            :items-list="allTests">
        </SuitTestDropdown>
        <div class="selectpicker-titled mr-2">
            <span class="font-h6 font-semibold px-3 item__left">BACKEND AGGREGATION</span>
            <select class="selectpicker" data-style="item__right" id="metricAggregation"
                :disabled="axis_type !== 'categorical'">
                <option value="min">min</option>
                <option value="max">max</option>
                <option value="mean">mean</option>
                <option value="pct50">50 pct</option>
                <option value="pct75">75 pct</option>
                <option value="pct90">90 pct</option>
                <option value="pct95">95 pct</option>
                <option value="pct99">99 pct</option>
            </select>
        </div>
        <div class="selectpicker-titled mr-2">
            <span class="font-h6 font-semibold px-3 item__left">UI METRIC</span>
            <select class="selectpicker" data-style="item__right" id="metricMini">
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
        <TextToggle
            :disabled_buttons="loadingChartTime"
            style="margin-top: 1px;"
            v-model="axis_type"
            :labels='["categorical", "time"]'
            radio_group_name="chart_group_axis_type"
        ></TextToggle>
    </div>
        <div class="d-grid grid-column-4 my-3">
            <div class="chart-container">
                <canvas id="throughputChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="errorRateChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="responseTimeChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="pageSpeedChart"></canvas>
            </div>
        </div>
    </div>
    `
}
register_component('SuitMiniCharts', SuitMiniCharts)