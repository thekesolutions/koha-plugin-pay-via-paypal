<template>
  <v-content>
    <v-container>
      <v-form ref="form" v-model="valid">
        <v-card>
          <v-card-actions>
            <v-btn @click="save()" :disabled="!valid">
              <v-icon>mdi-check</v-icon> Save
            </v-btn>
          </v-card-actions>
        </v-card>
        <v-card v-if="schema && schema.properties && schema.properties.generalOptions">
          <v-card-title>
            General options
          </v-card-title>
          <v-card-text>
            <v-jsonschema-form
              :schema="schema.properties.generalOptions"
              :model="generalConfs"
              :options="options"
            />
          </v-card-text>
        </v-card>
        <v-card v-if="schema && schema.properties && schema.properties.perLibraryOptions">
          <v-card-title>
            Per library options
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col md="auto">
                <v-navigation-drawer
                  :mini-variant.sync="mini"
                  permanent
                >
                  <v-list-item>
                    <v-slide-x-transition>
                      <v-autocomplete
                        v-show="!mini"
                        :items="unconfLibraries()"
                        item-text="name"
                        item-value="library_id"
                        label="Add library"
                        hint="Search to add a library"
                        v-model="library_add"
                        @keyup.enter="addLibrary()"
                      />
                    </v-slide-x-transition>

                    <v-btn icon @click="addLibrary()">
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>

                    <v-btn icon class="rotatable" :class="{'rotate': mini}" @click="mini = !mini" >
                      <v-icon>mdi-chevron-left</v-icon>
                    </v-btn>

                  </v-list-item>
                  <v-divider />
                  <v-list>
                    <v-list-item-group v-model="selected_idx" mandatory color="primary" >
                      <v-list-item v-for="(cl, i) in libraryConfs" :key="i">
                        <v-list-item-avatar>
                          <v-avatar :color="getColor(cl)" :class="getTextColor(cl)" class="font-weight-black" >
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
                <template v-for="(cl, i) in libraryConfs">
                  <v-jsonschema-form
                    :key="i"
                    :schema="schema.properties.perLibraryOptions"
                    :model="cl"
                    v-show="selected_idx === i"
                    :options="options"
                    @error="showError"
                    @change="showChange"
                    @input="showInput"
                  >
                    <template #prepend-custom-inherit="{ model, modelWrapper, modelKey, schema }" v-if="cl.library_id != null">
                      <v-col :cols="schema['x-set-inherit']?12:2">
                        <v-checkbox v-model="setInherit(schema, model)['x-set-inherit']" hint="Use default option" :persistent-hint="!schema['x-set-inherit']" >
                          <template v-slot:label>
                            <div v-if="schema['x-set-inherit']">Using {{ schema.title || modelKey }} from default options</div>
                          </template>
                        </v-checkbox>
                      </v-col>
                    </template>
                    <template #custom-inherit="{ schema, modelWrapper, modelKey }" v-if="cl.library_id != null">
                      <v-col cols="10">
                        <property
                          v-if="!schema['x-set-inherit']"
                          :schema="schema"
                          :model-wrapper="modelWrapper"
                          :model-key="modelKey"
                          :options="{}"
                        />
                      </v-col>
                    </template>
                  </v-jsonschema-form>
                </template>
                  <!-- <template #custom-library="{ fullSchema, modelWrapper, modelKey, rules, fullKey }">
                    <v-select
                      v-model="modelWrapper[modelKey]"
                      :name="fullKey"
                      :label="fullSchema.title || (typeof modelKey === 'string' ? modelKey : '')"
                      :rules="rules"
                      :items="libraries"
                      item-text="name"
                      item-value="library_id"
                      />
                  </template>
                </v-jsonschema-form> -->
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <v-card>
          <v-card-actions>
            <v-btn @click="save()">
              <v-icon>mdi-check</v-icon> Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-container>
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
import { mapState, mapMutations } from 'vuex'
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
      general: {},
      dummy: {},
      mini: false,
      default_inherit: [],
      library_add: null,
      valid: true,
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
      libraryConfs: state => _.merge([], state.libConfs)
    }),
    ...mapState('libraries', {
      libraries: state => _.merge([], state.list)
    }),
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
      'set_general_confs',
      'set_library_confs'
    ]),
    save () {
      this.set_general_confs(_.merge({}, this.generalConfs))
      this.set_library_confs(_.merge([], this.libraryConfs))
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
    showError (err) {
      window.alert(err)
    },
    showChange (e) {
      console.log('"change" event', e)
    },
    showInput (e) {
      console.log('"input" event', e)
    },
    unconfLibraries () {
      return this.libraries.filter(lib => lib.library_id && !this.libraryConfs.find(conf => lib.library_id === conf.library_id))
    },
    setInherit (schema, model) {
      if (!schema.hasOwnProperty('x-set-inherit')) {
        this.$set(schema, 'x-set-inherit', model === null)
      }
      return schema
    }
  }
}
</script>
