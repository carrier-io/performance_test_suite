var ParamsTable = {
    inputFormatter(value, row, index, field, tableId) {
        return `<div class="custom-input w-100">
                <input type="text" value="${value}" onchange="ParamsTable.updateCell(this, ${index}, '${field}', '${tableId}')" value="${value}">
            </div>`
    },
    deleteRowFormatter: (value, row, index, tableId) => {
        return `
            <button class="btn btn-default btn-xs btn-table btn-icon__xs mr-2" style="width: 150px;"
                onclick="ParamsTable.removeParamRow(this, '${index}', '${row.name}', '${tableId}')">
                <i class="icon__16x16 icon-delete"></i>
            </button>
        `
    },
    removeParamRow: (el, index, rowName, tableId) => {
        $(el.closest('table')).bootstrapTable('remove', {
            field: '$index',
            values: [+index]
        })
        ParamsTable.updateParentTable(tableId)
    },
    updateCell: (el, row, field, tableId) => {
        $(el.closest('table')).bootstrapTable(
            'updateCell',
            {index: row, field: field, value: el.value}
        );
        ParamsTable.updateParentTable(tableId)
    },
    updateParentTable(tableId) {
        const testParams = $(`#test_params_${tableId}`).bootstrapTable('getData');
        console.log(testParams)
        $('#allTests').bootstrapTable('updateCellByUniqueId', {
            id: tableId,
            field: 'test_parameters',
            value: testParams,
            reinit: false
        })
    },
    suitTestFormatter(value, row, index, field) {
        if (!row.tests.length) return '';

        if (row.tests.length < 3) {
            const listTagsBtn = row.tests.map(test =>
                `<button class="btn btn-xs btn-painted mr-1 rounded-pill">${test.name}
            </button>`
            )
            return listTagsBtn.join('');
        }

        const firstTest = row.tests[0];
        const firstTestBtn = `<button class="btn btn-xs btn-painted mr-1 rounded-pill" style="--brd-color: #EAEDEF">${firstTest.name}
        </button>`

        const listTestsInfo = row.tests.slice(1).map(test =>
            `<div class="my-1 mx-3">
                <button class="btn btn-xs btn-painted rounded-pill pl-2.5 pr-2.5">
                    ${test.name}
                </button>
            </div>`).join("");
        const sizeTags = row.tests.slice(1).length;
        const randomId = `listtooltip_${new Date() + Math.floor(Math.random() * 1000)}`
        const infoTags = `<button
                                class="btn btn-xs btn-painted btn-painted__size rounded-pill px-2"
                                style="--text-color: #757F99; --brd-color: #EAEDEF"
                                data-toggle="${randomId}"
                                data-html="true"
                                data-offset="80% 20%"
                                title="true">
                                + ${sizeTags}
                          </button>`

        setTimeout(() => {
            const attrTooltip = `[data-toggle="${randomId}"]`
            $(attrTooltip).tooltip({
                sanitize: false,
                boundary: 'body',
                template: `
                    <div class="tooltip tooltip__custom" role="tooltip">
                        <div class="tooltip-inner__custom d-flex flex-column">
                            ${listTestsInfo}
                        </div>
                    </div>
                `
            })
        },0);
        return `${firstTestBtn}${infoTags}`
    },
    deleteSuit() {
        return `
        <div class="d-flex justify-content-end">
            <button type="button" class="btn btn-default btn-xs btn-table btn-icon__xs action_delete ml-2">
                <i class="icon__18x18 icon-delete"></i>
            </button>
        </div>
        `
    },
    actions(value, row, index) {
        return `
            <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-default btn-xs btn-table btn-icon__xs action_delete ml-2">
                    <i class="icon__18x18 icon-delete"></i>
                </button>
            </div>
        `
    },
    action_events: {
        'click .action_delete': function (e, value, row, index) {
            vueVm.registered_components['suits'].removeRow(index)
        }
    },
    detailFormatter(index, row) {
        var html = []
        $.each(row, function (key, value) {
            html.push('<p><b>' + key + ':</b> ' + value + '</p>')
        })
        return html.join('')
    }
}
