const SuitSearch = {
    props: {
        itemsList: {
            default: () => []
        },
        isAllChecked: {
            default: false,
        },
        initSelectedItem: {
            default: [],
        },
        copiedTest: {
            default: {},
        }
    },
    data() {
        return {
            refSearchId: 'refSearchCbx'+uuidv4(),
            refDropdownId: 'refDropdown'+uuidv4(),
            selectedItems: [],
            closeOnItem: true,
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
                return this.selectedItems[0].name
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
            this.$refs[this.refSearchId].checked = this.selectedItems.length === this.foundedItems.length;
        },
        initSelectedItem: {
            handler: function (val, oldVal) {
                this.selectCheckBoxes();
            },
            deep: true
        },
        copiedTest: {
            handler: function (val, oldVal) {
                if (val.uid && val.uid !== oldVal.uid) {
                    this.foundedItems.push(val);
                    this.$nextTick(() => {
                        this.selectCheckBoxes();
                    })
                }
            },
            deep: true
        },
    },
    mounted() {
        this.$nextTick(() => {
            if (this.initSelectedItem.length > 0) {
                this.selectCheckBoxes();
            }
        })
        if (this.isAllChecked) {
            this.handlerSelectAll();
        }
        $(".dropdown-menu.close-outside").on("click", function (event) {
            event.stopPropagation();
        });
    },
    methods: {
        selectCheckBoxes() {
            this.selectedItems = []
            this.$refs[this.refDropdownId].forEach(el => {
                el.checked = false
                this.initSelectedItem.forEach(test => {
                    // TODO
                    if (el.id === test.uid || el.id === test.test_uid) {
                        this.selectedItems.push(test)
                        el.checked = true
                    }
                })
            })
        },
        handlerSelectAll() {
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
            this.$emit('select-items', this.selectedItems);
        },
        setClickedItem(title, { target: { checked }}) {
            this.selectedItems = checked ?
                [...this.selectedItems, title] :
                this.selectedItems.filter(item => {
                    return item.uid !== title.uid
                });
            this.$emit('select-items', this.selectedItems);
        },
        searchItem({ target: { value }}) {
            this.selectedItems = [];
            this.$refs[this.refDropdownId].forEach(el => {
                el.checked = false;
            })
            if (value) {
                this.foundedItems = this.itemsList.filter(item => {
                    return item.name.toUpperCase().includes(value.toUpperCase())
                })
            } else {
                this.foundedItems  = [...this.itemsList]
            }
        }
    },
    template: `
        <div id="complexList" class="complex-list w-100">
            <button class="btn btn-select bootstrap-select__sm dropdown-toggle px-2.5 text-left w-100" type="button"
                style="height: 40px"
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="d-inline-block"
                    :class="classTitle"
                    style="width: calc(100% - 26px);">{{ computedTitle }}</span>
            </button>
            <div class="dropdown-menu close-outside">
                <div class="px-3 pb-2 search-group">
                    <div class="custom-input custom-input_search__sm position-relative">
                        <input
                            type="text"
                            placeholder="Search"
                            @input="searchItem">
                        <img src="/design-system/static/assets/ico/search.svg" class="icon-search position-absolute">
                    </div>
                </div>
                <div class="dropdown-item dropdown-menu_item d-flex align-items-center">
                    <label
                        class="mb-0 w-100 d-flex align-items-center custom-checkbox"
                        :class="{ 'custom-checkbox__minus': isAllSelected }">
                        <input
                            :ref="refSearchId"
                            @click="handlerSelectAll"
                            type="checkbox">
                        <span class="w-100 d-inline-block ml-3">All rows</span>
                    </label>
                </div>
                <ul class="my-0" style="overflow: scroll; max-height: 183px;" v-if="foundedItems.length > 0">
                    <li class="dropdown-item dropdown-menu_item d-flex align-items-center"
                        v-for="item in foundedItems" :key="item">
                        <label
                            class="mb-0 w-100 d-flex align-items-center custom-checkbox">
                            <input
                                :ref="refDropdownId"
                                :id="item.uid"
                                @click="setClickedItem(item, $event)"
                                type="checkbox">
                            <div class="d-flex w-100 ">
                                <p class="ml-3 mb-0 flex-grow-1">{{ item.name }}</p>
                                <p class="mb-0">{{ item.test_type}}</p>
                            </div>
                        </label>
                    </li>
                </ul>
            </div>
        </div>`
};