<template>
  <v-content>
    <v-container>
      <v-card>
        <v-card-title>
          <v-flex>Configure</v-flex>
        </v-card-title>
        <v-row>
          <v-col>
            <v-navigation-drawer
              left
            >
              <v-list>
                <v-list-item-group v-model="selected" color="primary">
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
            </v-card-text>
          </v-col>
        </v-row>
      </v-card>
    </v-container>
  </v-content>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Configure',
  data () {
    return {
      selected: 0
    }
  },
  computed: {
    ...mapState({
      items: 'list'
    }),
    ...mapState('libraries', {
      libraries: 'list'
    })
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
    // get_selected () {
    //   if (!this.items || !this.items.length) { return null }
    //   if (!this.selected) { this.selected = this.items[0] }
    //   return this.selected
    // }
  }
}
</script>
