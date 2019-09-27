<template>
  <v-content>
    <v-container>
      <v-card>
        <v-card-title>
          Plugin configuration
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-jsonschema-form
              v-if="schema"
              :schema="schema"
              :model="confs"
              :options="options"
            />
          </v-form>
          {{ confs }}
          {{ schema }}
        </v-card-text>
        <v-card-actions>
        </v-card-actions>
      </v-card>
    </v-container>
  </v-content>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import VJsonschemaForm from '@koumoul/vuetify-jsonschema-form'
import _ from 'lodash'

export default {
  name: 'Configure',
  components: {
    VJsonschemaForm
  },
  data () {
    return {
      selected_idx: 0,
      general: {},
      options: {
        debug: true
      }
    }
  },
  computed: {
    confs: {
      ...mapState({
        get: (state) => {
          return _.merge({}, state.confs)
        }
      }),
      ...mapMutations({
        set: 'set_confs'
      })
    },
    ...mapState('libraries', {
      libraries: 'list'
    }),
    schema: {
      ...mapState('schema', {
        get: (state) => {
          return _.merge({}, state.schema)
        }
      }),
      ...mapMutations('schema', {
        set: 'set_schema'
      })
    },
    selected () {
      if (!this.items || this.items.length) { return null }
      return this.items[this.selected_idx]
    }
  },
  async fetch ({ store, params }) {
    await store.dispatch('get_configs')
  },
  methods: {
    getLibraryName (id) {
      if (!id) { return 'Default' }
      if (!this.libraries || !this.libraries.length) { return '' }
      return this.libraries.filter(library => library.library_id === id)[0].name
    }
  }
}
</script>
