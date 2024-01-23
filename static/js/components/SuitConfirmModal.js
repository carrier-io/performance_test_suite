const SuitConfirmModal = {
    props: ['loadingDelete'],
    template: `
    <div class="modal-component" @click.self="$emit('close-confirm')">
        <div class="modal-card">
            <p class="font-bold font-h3 mb-4">Delete suit?</p>
            <p class="font-h4 mb-4">Are you sure to delete suit?</p>
            <div class="d-flex justify-content-end mt-4">
                <button type="button" class="btn btn-secondary mr-2" @click="$emit('close-confirm')">Cancel</button>
                <button
                    class="btn btn-basic mr-2 d-flex align-items-center"
                    @click="$emit('delete-suit')"
                >Delete<i v-if="loadingDelete" class="preview-loader__white ml-2"></i></button>
            </div>
        </div>
    </div>
`
}