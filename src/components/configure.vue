<template>
  <v-content>
    <v-container>
      <v-card v-if="schema && schema.properties && schema.properties.generalOptions">
        <v-card-actions>
          <v-btn :disabled="!gen_form_valid || !lib_form_valid" @click="save()">
            <v-icon>mdi-check</v-icon> <span v-t="'save'" />
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
                      :label="$t('addLib')"
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
                    <v-list-item v-for="(cl, i) in libraryConfs" :key="i" :ref="'lib_'+i" :inactive="selected_idx !== i" @click.stop="checkForm($event, i)">
                      <v-list-item-avatar>
                        <v-avatar :color="getColor(cl)" :class="getTextColor(cl)" class="font-weight-black">
                          {{ cl.library_id || $t('all') }}
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
                    <template v-if="cl.library_id != null && defaultActive" #prepend-custom-inherit="{ model, modelWrapper, modelKey, modelRoot, schema }">
                      <v-col :cols="schema['x-set-inherit']?12:2">
                        <v-checkbox v-model="setInherit(schema, model)['x-set-inherit']" :hint="$t('perLibraryOps.use')" :persistent-hint="!schema['x-set-inherit']">
                          <template v-slot:label>
                            <div v-if="schema['x-set-inherit']">
                              {{ $t('perLibraryOps.using', { name: schema.title || modelKey }) }}
                            </div>
                          </template>
                        </v-checkbox>
                      </v-col>
                    </template>
                    <template v-if="cl.library_id != null && defaultActive" #custom-inherit="{ schema, modelWrapper, modelKey, modelRoot, options, fullKey, required }">
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
                v-model="libDialog"
                max-width="600"
              >
                <v-card>
                  <v-card-title v-t="'dialog.change'" class="headline" />

                  <v-card-text>
                    <v-list>
                      <v-list-item v-t="'dialog.invalid'" class="body-1" />
                      <v-list-item>
                        <v-alert v-t="'dialog.warning'" type="warning" />
                      </v-list-item>
                      <v-list-item v-t="'dialog.continue'" class="body-1" />
                    </v-list>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer />

                    <v-btn
                      v-t="'cancel'"
                      color="primary"
                      outlined
                      @click="dialog = false"
                    />

                    <v-btn
                      v-t="'continue'"
                      color="primary"
                      outlined
                      @click="forcedContinue()"
                    />
                  </v-card-actions>
                </v-card>
              </v-dialog>
              <v-dialog
                v-model="defDialog"
                max-width="600"
              >
                <v-card>
                  <v-card-title v-t="'dialog.mandatory'" class="headline" />

                  <v-card-text>
                    <v-list>
                      <v-list-item v-t="'dialog.invalid'" class="body-1" />
                      <v-list-item>
                        <v-alert v-t="selected_idx===0?'dialog.error':'dialog.noDef'" type="error" />
                      </v-list-item>
                    </v-list>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer />

                    <v-btn
                      v-t="'agree'"
                      color="primary"
                      outlined
                      @click="dialog = false"
                    />
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn :disabled="!gen_form_valid || !lib_form_valid" @click="save()">
            <v-icon>mdi-check</v-icon> <span v-t="'save'" />
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
    <v-snackbar v-model="showSnackbar" :color="snack.type" :timeout="3000">
      {{ snack.message }}
    </v-snackbar>
  </v-content>
</template>

<style scoped>
.rotate {
  transform: rotate(180deg)
}

.rotatable {
  transition: transform 300ms
}

button {
  background-image: none
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
        accordionMode: 'normal',
        requiredMessage: this.$t('required')
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
    },
    defaultActive () {
      return this.schema.properties.perLibraryOptions && this.schema.properties.perLibraryOptions.properties.active && this.libraryConfs.find(lib => lib.library_id === null).active
    },
    libDialog () {
      return this.dialog && this.selected_idx > 0 && this.defaultActive
    },
    defDialog () {
      return this.dialog && (this.selected_idx === 0 || !this.defaultActive)
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
      return rMC.getColor({ text: conf.library_id || this.$t('all') })
    },
    getTextColor (conf) {
      return this.getContrastYIQ(this.getColor(conf))
    },
    getName (conf) {
      if (!conf.library_id) { return this.$t('allLibs') }
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
