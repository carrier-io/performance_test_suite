const DockerCommandModal = {
    delimiters: ['[[', ']]'],
    props: ['modal_id'],
    data() {
        return {
            cmd: '',
            is_open: false,
        }
    },
    mounted() {
        $(this.$el).on('hide.bs.modal', this.clear)
        $(this.$el).on('show.bs.modal', () => this.is_open = true)
    },
    watch: {
        is_open(newValue, oldValue) {
            console.log(newValue, oldValue, newValue !== oldValue && newValue ? 'this.show()' : 'this.hide()')
            newValue !== oldValue && newValue ? this.show() : this.hide()
        }
    },
    methods: {
        show() {
            $(this.$el).modal('show')
        },
        hide() {
            $(this.$el).modal('hide')
        },
        clear() {
            this.cmd = ''
            this.is_open = false
        },
        handle_copy(e) {
            this.$refs.textarea.select();
            document.execCommand("copy");
            document.getSelection().empty()
            showNotify('SUCCESS', 'Copied to clipboard')
        },
    },
    template: `
    <div class="modal modal-small fixed-left fade shadow-sm" tabindex="-1" role="dialog" 
        :id="modal_id || 'docker_command_modal_default'"
    >
        <div class="modal-dialog modal-dialog-aside" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="row w-100">
                        <div class="col">
                            <h2>Docker command</h2>
                        </div>
                        <div class="col-xs">
                            <button type="button" class="btn btn-secondary"
                                @click="is_open = false"    
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="section">
                        <div class="row">
                            <div class="col">
                                <h9>Autogenerated execution config</h9>
                                    <p><h13>Some description or short guide how to integrate ...</h13></p>
                                    <textarea type="text" readonly
                                        class="my-2"
                                        style="width: 100%; height: 150px; border-radius: 5px;"
                                        :value="cmd"
                                        ref="textarea"
                                    />
                            </div>
                        </div>
                        <div class="row">
                            <button type="button" class="btn btn-sm btn-basic" 
                                @click="handle_copy"
                            >
                                    Copy command
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
}

register_component('DockerCommandModal', DockerCommandModal)
