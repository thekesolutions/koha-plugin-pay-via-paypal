<template>
  <v-content>
    <v-container>
      <v-card v-if="schema && schema.properties && schema.properties.generalOptions">
        <v-card-actions>
          <v-btn :disabled="!gen_form_valid || !lib_form_valid" @click="save()">
            <v-icon>mdi-check</v-icon> Save
          </v-btn>
        </v-card-actions>
        <v-card-title v-t="'generalOps.title'" />
        <v-card-text>
          <v-form ref="gen_form" v-model="gen_form_valid">
            <v-jsonschema-form
              :schema="schema.properties.generalOptions"
              :model="generalConfs"
              :options="options"
            />
          </v-form>
        </v-card-text>
      </v-card>
      <v-card v-if="schema && schema.properties && schema.properties.perLibraryOptions">
        <v-card-title v-t="'perLibraryOps.title'" />
        <v-card-text>
          <v-row>
            <v-col md="auto">
              <v-navigation-drawer
                :mini-variant="mini"
                permanent
              >
                <v-list-item>
                  <v-btn icon class="rotatable" :class="{'rotate': mini}" @click="mini = !mini">
                    <v-icon>mdi-chevron-left</v-icon>
                  </v-btn>

                  <v-slide-x-transition>
                    <v-autocomplete
                      v-model="library_add"
                      :items="unconfLibraries()"
                      item-text="name"
                      item-value="library_id"
                      label="Add library"
                      hint="Search to add a library"
                      @keyup.enter="addLibrary()"
                    />
                  </v-slide-x-transition>

                  <v-btn icon @click="addLibrary()">
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </v-list-item>
                <v-divider />
                <v-list>
                  <v-list-item-group v-model="prev_selected_idx" mandatory color="primary">
                    <v-list-item :inactive="selected_idx !== i" v-for="(cl, i) in libraryConfs" :key="i" @click.stop="checkForm($event, i)" :ref="'lib_'+i">
                      <v-list-item-avatar>
                        <v-avatar :color="getColor(cl)" :class="getTextColor(cl)" class="font-weight-black">
                          {{ cl.library_id || 'All' }}
                        </v-avatar>
                      </v-list-item-avatar>
                      <v-list-item-content transition="fade-transition">
                        <v-list-item-title>{{ getName(cl) }}</v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>
              </v-navigation-drawer>
            </v-col>
            <v-col>
              <v-form ref="lib_form" v-model="lib_form_valid">
                <template v-for="(cl, i) in libraryConfs">
                  <v-jsonschema-form
                    v-if="selected_idx === i"
                    :key="i"
                    :schema="schema.properties.perLibraryOptions"
                    :model="cl"
                    :options="options"
                  >
                    <template v-if="cl.library_id != null" #prepend-custom-inherit="{ model, modelWrapper, modelKey, schema }">
                      <v-col :cols="schema['x-set-inherit']?12:2">
                        <v-checkbox v-model="setInherit(schema, model)['x-set-inherit']" hint="Use default option" :persistent-hint="!schema['x-set-inherit']">
                          <template v-slot:label>
                            <div v-if="schema['x-set-inherit']">
                              Using {{ schema.title || modelKey }} from default options
                            </div>
                          </template>
                        </v-checkbox>
                      </v-col>
                    </template>
                    <template v-if="cl.library_id != null" #custom-inherit="{ schema, modelWrapper, modelKey, modelRoot, options, fullKey, required }">
                      <v-col cols="10">
                        <property
                          v-if="!schema['x-set-inherit']"
                          :schema="schema"
                          :model-wrapper="modelWrapper"
                          :model-key="modelKey"
                          :parent-key="fullKey"
                          :model-root="modelRoot"
                          :required="required"
                          :options="options"
                        />
                      </v-col>
                    </template>
                  </v-jsonschema-form>
                </template>
              </v-form>
              <v-dialog
                v-model="dialog"
                max-width="600"
                v-if="selected_idx > 0">
                <v-card>
                  <v-card-title class="headline">Change current library?</v-card-title>

                  <v-card-text>
                    <v-list>
                      <v-list-item class="body-1">
                        Some fields in this configuration are invalid.
                      </v-list-item>
                      <v-list-item>
                        <v-alert type="warning">
                          If you continue, invalid data will use default options
                        </v-alert>
                      </v-list-item>
                      <v-list-item class="body-1">
                        Are you sure you want to continue?
                      </v-list-item>
                    </v-list>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>

                    <v-btn
                      color="primary"
                      outlined
                      @click="dialog = false"
                    >
                      Cancel
                    </v-btn>

                    <v-btn
                      color="primary"
                      outlined
                      @click="forcedContinue()"
                    >
                      Continue
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
              <v-dialog
                v-model="dialog"
                max-width="600"
                v-if="selected_idx === 0">
                <v-card>
                  <v-card-title class="headline">Mandatory fields missing</v-card-title>

                  <v-card-text>
                    <v-list>
                      <v-list-item class="body-1">
                          Some fields in this configuration are invalid.
                      </v-list-item>
                      <v-list-item>
                        <v-alert type="error">
                          You cannot configure other libraries until all default values are valid
                        </v-alert>
                      </v-list-item>
                    </v-list>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>

                    <v-btn
                      color="primary"
                      outlined
                      @click="dialog = false"
                    >
                      Agree
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn :disabled="!gen_form_valid || !lib_form_valid" @click="save()">
            <v-icon>mdi-check</v-icon> Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
    <v-snackbar v-model="showSnackbar" :color="snack.type" :timeout="3000">
      {{ snack.message }}
    </v-snackbar>
  </v-content>
</template>

<style>
.rotate {
  transform: rotate(180deg)
}

.rotatable {
  transition: transform 300ms
}
</style>

<script>
import { mapState, mapMutations, mapActions } from 'vuex'
import VJsonschemaForm from '@koumoul/vuetify-jsonschema-form/lib/index.vue'
import Property from '@koumoul/vuetify-jsonschema-form/lib/components/Property.vue'
import _ from 'lodash'
import rMC from 'random-material-color'

export default {
  name: 'Configure',
  components: {
    VJsonschemaForm,
    Property
  },
  data () {
    return {
      selected_idx: 0,
      prev_selected_idx: 0,
      next_selected_idx: 0,
      general: {},
      dummy: {},
      mini: false,
      default_inherit: [],
      library_add: null,
      gen_form_valid: true,
      lib_form_valid: true,
      dialog: false,
      options: {
        debug: true,
        disableAll: false,
        autoFoldObjects: false,
        accordionMode: 'normal'
      }
    }
  },
  computed: {
    ...mapState({
      generalConfs: state => _.merge({}, state.general),
      libraryConfs: state => _.merge([], state.libConfs),
      snack: 'snackbar'
    }),
    ...mapState('libraries', {
      libraries: state => _.merge([], state.list)
    }),
    showSnackbar: {
      get () {
        return !!this.snack
      },
      set () {
        this.snackbar(false)
      }
    },
    schema: {
      ...mapState('schema', {
        get: state => _.merge({}, state.schema)
      }),
      ...mapMutations('schema', {
        set: 'set_schema'
      })
    }
  },
  async fetch ({ store, params }) {
    await store.dispatch('get_configs')
  },
  methods: {
    ...mapMutations([
      'general_confs',
      'library_confs',
      'snackbar'
    ]),
    ...mapActions({
      store: 'save'
    }),
    save () {
      this.general_confs(_.merge({}, this.generalConfs))
      this.library_confs(_.merge([], this.libraryConfs))
      this.store()
    },
    getColor (conf) {
      return rMC.getColor({ text: conf.library_id || 'All' })
    },
    getTextColor (conf) {
      return this.getContrastYIQ(this.getColor(conf))
    },
    getName (conf) {
      if (!conf.library_id) { return 'All libraries' }
      if (!this.libraries || !this.libraries.length) { return '' }
      return this.libraries.find(library => library.library_id === conf.library_id).name
    },
    stringToColor (string) {
      return rMC.getColor({ text: string })
    },
    addLibrary () {
      if (!this.library_add) { return }

      this.libraryConfs.push({ library_id: this.library_add })
      this.library_add = null
    },
    getContrastYIQ (hexcolor) {
      hexcolor = hexcolor.replace('#', '')
      const r = parseInt(hexcolor.substr(0, 2), 16)
      const g = parseInt(hexcolor.substr(2, 2), 16)
      const b = parseInt(hexcolor.substr(4, 2), 16)
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
      return (yiq >= 125) ? 'black--text' : 'white--text'
    },
    unconfLibraries () {
      return this.libraries.filter(lib => lib.library_id && !this.libraryConfs.find(conf => lib.library_id === conf.library_id))
    },
    setInherit (schema, model) {
      if (!schema.hasOwnProperty('x-set-inherit')) {
        this.$set(schema, 'x-set-inherit', model === null)
      }
      return schema
    },
    checkForm (event, i) {
      console.log(event)
      console.log(this.$refs.lib_form)
      if (!this.$refs.lib_form.validate()) {
        this.dialog = true
        this.$nextTick(() => {
          this.next_selected_idx = this.prev_selected_idx
          this.prev_selected_idx = this.selected_idx
        })
        event.preventDefault()
        return
      }
      this.$nextTick(() => {
        this.selected_idx = this.prev_selected_idx
      })
    },
    forcedContinue () {
      this.dialog = false
      this.$refs.lib_form.inputs.forEach((input) => {
        if (!input.validate()) {
          input.value = null
        }
      })
      this.$nextTick(() => {
        this.selected_idx = this.prev_selected_idx = this.next_selected_idx
      })
    }
  }
}
</script>
