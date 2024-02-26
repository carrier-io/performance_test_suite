const SuitTestDropdown = {
    props: {
        itemsList: {
            default: () => []
        },
        isAllChecked: {
            default: false,
        }
    },
    data() {
        return {
            refSearchId: 'refSearchCbx'+uuidv4(),
            refDropdownId: 'refDropdown'+uuidv4(),
            selectedItems: [],
            closeOnItem: true,
            clickedItem: {
                title: '',
                isChecked: false,
            },
            foundedItems: [...this.itemsList],
            classTitle: 'complex-list_filled',
        }
    },
    computed: {
        isAllSelected() {
            return (this.selectedItems.length < this.itemsList.length) && this.selectedItems.length > 0
        },
        computedTitle() {
            if (this.selectedItems.length === 1) {
                this.classTitle = 'complex-list_filled'
                return this.selectedItems[0]
            }
            if (this.selectedItems.length > 1) {
                this.classTitle = 'complex-list_filled'
                return `${ this.selectedItems.length } selected`
            }
            if (this.selectedItems.length === 0) {
                this.classTitle = 'complex-list_empty'
                return 'Select'
            }
        }
    },
    watch: {
        selectedItems: function () {
            this.$refs[this.refSearchId].checked = this.selectedItems.length === this.foundedItems.length ? true : false;
        }
    },
    mounted() {
        if (this.isAllChecked) {
            this.handlerSelectAll(true);
        }
        $(".dropdown-menu.close-outside").on("click", function (event) {
            event.stopPropagation();
        });
    },
    methods: {
        handlerSelectAll(isInit) {
            if (this.selectedItems.length !== this.foundedItems.length) {
                this.selectedItems = [...this.foundedItems];
                this.$refs[this.refDropdownId].forEach(el => {
                    el.checked = true;
                })
            } else {
                this.selectedItems.splice(0);
                this.$refs[this.refDropdownId].forEach(el => {
                    el.checked = false;
                })
            }
            if (isInit) return
            this.$emit('select-items', this.selectedItems);
        },
        setClickedItem(title, { target: { checked }}) {
            this.selectedItems = checked ?
                [...this.selectedItems, title] :
                this.selectedItems.filter(item => item !== title);
            this.$emit('select-items', this.selectedItems);
        },
        searchItem({ target: { value }}) {
            this.selectedItems = [];
            this.$refs[this.refDropdownId].forEach(el => {
                el.checked = false;
            })
            if (value) {
                this.foundedItems = this.itemsList.filter(metric => {
                    return metric.toUpperCase().includes(value.toUpperCase())
                })
            } else {
                this.foundedItems  = [...this.itemsList]
            }
        }
    },
    template: `
        <div id="complexList" class="complex-list mr-2">
            <button class="btn btn-select bootstrap-select__sm dropdown-toggle position-relative text-left d-flex align-items-center" type="button"
                style="height: 32px; min-width: 200px"
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="dropdown-toggle_label font-weight-600 font-h6">TESTS</span>
                <span class="d-inline-block"
                    :class="classTitle"
                    style="width: calc(100% - 26px);">{{ computedTitle }}</span>
            </button>
            <div class="dropdown-menu close-outside">
                <div class="dropdown-item dropdown-menu_item d-flex align-items-center">
                   <label
                        class="mb-0 w-100 d-flex align-items-center custom-checkbox"
                        :class="{ 'custom-checkbox__minus': isAllSelected }">
                        <input
                            :ref="refSearchId"
                            @click="() => handlerSelectAll(false)"
                            type="checkbox">
                        <span class="w-100 d-inline-block ml-3">All tests</span>
                   </label>
                </div>
                <ul class="my-0" style="overflow: scroll; max-height: 183px;">
                    <li class="dropdown-item dropdown-menu_item d-flex align-items-center"
                        v-for="item in foundedItems" :key="item">
                         <label
                            class="mb-0 w-100 d-flex align-items-center custom-checkbox">
                            <input
                                :ref="refDropdownId"
                                @click="setClickedItem(item, $event)"
                                type="checkbox">
                            <span class="w-100 d-inline-block ml-3">{{ item }}</span>
                        </label>
                    </li>
                </ul>
            </div>
        </div>`
};