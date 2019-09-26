<template>
  <v-content>
    <v-container>
      <v-card v-if="fields.general">
        <v-card-title>
          Plugin configuration
        </v-card-title>
        <v-card-text>
          <v-form>
            <form-element v-for="(field, i) in fields" :key="i" field="field" />
          </v-form>
        </v-card-text>
        <v-card-actions>
        </v-card-actions>
      </v-card>
      <v-card v-if="fields.libraries">
        <v-card-title>
          <v-flex>Plugin configuration per library</v-flex>
        </v-card-title>
        <v-row>
          <v-col>
            <v-navigation-drawer
              left
            >
              <v-list>
                <v-list-item-group v-model="selected_idx" color="primary">
                  <v-list-item
                    v-for="(item, i) in items"
                    :key="i"
                  >
                    <v-list-item-action>
                      <v-icon>{{ item.icon }}</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                      <v-list-item-title v-text="getLibraryName(item.library_id)" />
                    </v-list-item-content>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-navigation-drawer>
          </v-col>
          <v-col>
            <v-card-text>
              <v-form v-if="selected">
                <v-text-field v-if="selected.type != 'select' || selected.type != 'textarea'" :type="selected.type" :label="selected.label" :required="selected.required" />
              </v-form>
            </v-card-text>
          </v-col>
        </v-row>
      </v-card>
    </v-container>
  </v-content>
</template>

<script>
import { mapState } from 'vuex'
import formElement from '~/components/form-element'

export default {
  name: 'Configure',
  components: {
    formElement
  },
  data () {
    return {
      selected_idx: 0
    }
  },
  computed: {
    ...mapState({
      items: 'list'
    }),
    ...mapState('libraries', {
      libraries: 'list'
    }),
    ...mapState('fields', {
      fields: 'list'
    }),
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
