var ParamsTable = {
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
    }
}
