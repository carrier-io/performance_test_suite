const SuitMiniCharts = {
    props: ['tests'],
    components: {
        SuitTestDropdown: SuitTestDropdown
    },
    data() {
        return {
            selectedTests: this.tests,
            chartIds: ['throughputChart', 'errorRateChart', 'responseTimeChart', 'pageSpeedChart'],
            metric: 'load_time',
            valuesFullName: {
                load_time: 'load_time',
                tti: 'time_to_interactive',
                fcp: 'first_contentful_paint',
                dom: 'dom_content_loading', // dom
                lcp: 'largest_contentful_paint',
                cls: 'last_visual_change', // 'cls',
                tbt: 'total_blocking_time',
                fvc: 'first_visual_change',
                lvc: 'last_visual_change',
            },
            valuesName: ['load_time', 'tti', 'fcp', 'dom', 'lcp', 'cls', 'tbt', 'fvc', 'lvc'],
            metricBE: 'pct95',
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
        this.generateChartOptions()
    },
    watch: {
        metric(newValue, oldValue) {
            window['pageSpeedChart'].destroy();
            window['pageSpeedChart'] = null;
            this.drawChart('ui', 'pageSpeedChart', newValue, 'ms', `PAGE SPEED`);
        },
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
                    borderWidth: 3,
                    pointRadius: 2,
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
                        borderWidth: 3,
                        pointRadius: 2,
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
        selectTest(tests) {
            this.selectedTests = {
                backend: this.tests.backend.filter(t => tests.includes(t.name)),
                ui: this.tests.ui.filter(t => tests.includes(t.name)),
            }
            this.chartIds.forEach(id => {
                window[id].destroy();
                window[id] = null;
            })
            this.generateChartOptions()
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
            <select class="selectpicker" data-style="item__right" id="metricAggregation">
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