const SuitResults = {
    props: ['instance_name', 'result'],
    components: {
    },
    data() {
        return {
        }
    },
    mounted() {
        setTimeout(() => {
            this.createTestsTable()
        }, 500)
    },
    methods: {
        createTestsTable() {
            const tableData = [
                ...this.result.tests.backend.map(row => ({ ...row, test_type: 'backend'})),
                ...this.result.tests.ui.map(row => ({ ...row, test_type: 'ui'}))];
            $('#tableTests').bootstrapTable('load', tableData);
        },
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
                </div>
                <div>
                    <hr class="my-0">
                    <div class="p-28 pt-3">
                        <p class="mb-0 font-semibold" style="color: var(--gray);"><i class="fas fa-exclamation-circle"></i> Status description</p>
                        <p class="mb-0">{{ result.suite_status.status }}</p>
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
                        <th scope="col" data-checkbox="true"></th>
                        <th data-visible="false" data-field="id">index</th>
                        <th scope="col" data-sortable="true" data-field="name" data-formatter="SuiteTable.createLinkToOriginTest">Name</th>
                        <th scope="col" data-sortable="true" data-field="total">TTL REQ, COUNT</th>
                        <th scope="col" data-sortable="true" data-field="throughput">THRGHPT, REQ/SEC</th>
                        <th scope="col" data-sortable="true" data-field="min">MIN, MS</th>
                        <th scope="col" data-sortable="true" data-field="max">MAX, MS</th>
                        <th scope="col" data-sortable="true" data-field="mean">MEDIAN, MS</th>
                        <th scope="col" data-sortable="true" data-field="pct95">PCT95, MS</th>
                    </template>
                </Table-Card>
            </div>
        </div>
    `
}

register_component('suit-results', SuitResults)