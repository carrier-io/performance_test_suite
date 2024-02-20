var SuiteTable = {
    reportsStatusFormatter(value, row, index) {
        switch (value.status) {
            case 'Failed':
                return `<div data-toggle="tooltip" data-placement="top" title="${value.description}" style="color: var(--red)"><i class="fas fa-exclamation-circle error"></i> ${value.status}</div>`
            case 'Finished':
                return `<div data-toggle="tooltip" data-placement="top" title="${value.description}" style="color: var(--info)"><i class="fas fa-check-circle"></i> ${value.status}</div>`
            case 'In progress':
                return `<div data-toggle="tooltip" data-placement="top" title="${value.description}" style="color: var(--basic)"><i class="fas fa-spinner fa-spin fa-secondary"></i> ${value.status}</div>`
            case 'Pending...':
                return `<div data-toggle="tooltip" data-placement="top" title="${value.description}" style="color: var(--basic)"><i class="fas fa-spinner fa-spin fa-secondary"></i> ${value.status}</div>`
            default:
                return value.status
        }
    },
    date_formatter(value) {
        return new Date(value).toLocaleString()
    },
    duration_formatter(value, row, index) {
        // console.log(row)
    },
    createLinkToTest(value, row, index) {
        return `<a class="test form-control-label font-h5" target="_blank" href="./results?result_id=${row.id}" role="button">${row.name}</a>`
    },
    createLinkToOriginTest(value, row, index) {
        return `<a class="test form-control-label font-h5" target="_blank" href="/-/performance/${row.test_type}/results?result_id=${row.id}" role="button">${row.name}</a>`
    },
    actions(value, row, index) {
        return `
            <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-default btn-xs btn-table btn-icon__xs suit_run mr-2" 
                        data-toggle="tooltip" data-placement="top" title="Run Suite">
                    <i class="icon__18x18 icon-run"></i>
                </button>
                <div class="dropdown_multilevel">
                    <button class="btn btn-default btn-xs btn-table btn-icon__xs" type="button"
                            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <i class="icon__18x18 icon-menu-dots"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li class="dropdown-menu_item dropdown-item d-flex align-items-center suit_edit">
                            <i class="icon__18x18 icon-settings mr-2"></i><span class="w-100 font-h5">Settings</span>
                        </li>
                        <li class="dropdown-menu_item dropdown-item d-flex align-items-center suit_delete">
                            <i class="icon__18x18 icon-delete mr-2"></i><span class="w-100 font-h5">Delete</span>
                        </li>
                    </ul>
                </div>
            </div>
        `
    },
    imageFormatter(test) {
        if (test.test_type === 'be') {
            if (test.job_type === "perfmeter") {
                return '<img src="/design-system/static/assets/ico/jmeter.png" width="20">'
            } else if (test.job_type === "perfgun") {
                return '<img src="/design-system/static/assets/ico/gatling.png" width="20">'
            } else {
                return value
            }
        } else if (test.test_type === 'ui') {
            switch (test.runner) {
                case 'Sitespeed (browsertime)':
                    return '<img src="/design-system/static/assets/ico/sitespeed.png" width="20">'
                case 'Lighthouse':
                case 'Lighthouse-Nodejs':
                    return '<img src="/design-system/static/assets/ico/lighthouse.png" width="20">'
                case 'Observer':
                    return '<img src="/design-system/static/assets/ico/selenium.png" width="20">'
                default:
                    return row.runner
            }
        }
    },
    job_type(value, row, index) {
        const images = row.tests.map(test => {
            return SuiteTable.imageFormatter(test)
        });
        const uniqImages = [...new Set(images)]
        return `<div class="d-flex gap-2">${uniqImages.join('')}</div>`
    },
    action_events: {
        'click .suit_run': function (e, value, row, index) {
            vueVm.registered_components['suits'].editSuit(row, 'run')
        },
        'click .suit_edit': function (e, value, row, index) {
            vueVm.registered_components['suits'].editSuit(row, 'edit')
        },
        'click .suit_delete': function (e, value, row, index) {
            vueVm.registered_components['suits'].preparedDeletingIds = [row.id];
            vueVm.registered_components['suits'].deletingTitle = 'suite';
            vueVm.registered_components['suits'].openConfirm()
        }
    },
    suitTestFormatter(value, row, index, field) {
        if (!row.tests.length) return '';

        if (row.tests.length < 3) {
            const listTagsBtn = row.tests.map(test =>
                `<button class="btn btn-xs btn-painted mr-1 rounded-pill" style="--brd-color: #EAEDEF">${test.name}
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
}

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
    job_type(value, row, index) {
        return SuiteTable.imageFormatter(row)
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
        $('#allTests').bootstrapTable('updateCellByUniqueId', {
            id: tableId,
            field: 'test_parameters',
            value: testParams,
            reinit: false
        })
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
            vueVm.registered_components['suit_modal'].removeRow(index, row)
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
