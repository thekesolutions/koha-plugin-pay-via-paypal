export const state = () => ({
  general: {},
  libConfs: [],
  clean: true,
  snackbar: false
})

export const actions = {
  async get_configs ({ commit, dispatch }) {
    dispatch('schema/get_schema')
    dispatch('libraries/get_libraries')

    try {
      const data = await this.$axios.$get('/api/v1/contrib/paypal/configs')
      
      if (!data.general) {
        data.general = { PayPalSandboxMode: false }
      }
      if (!data.libraries || !data.libraries.length) {
        // throw new Error('Could not get configuration list')
        data.libraries = [{ active: true, library_id: null }]
      }

      commit('general_confs', data.general)
      commit('library_confs', data.libraries)
    } catch (e) {
      console.log(e)
      commit('snackbar', { type: 'error', message: this.app.i18n.t('connection.noConfigs') })
    }
  },
  async save ({ commit, state }) {
    if (state.clean) {
      return commit('snackbar', { type: 'info', message: this.app.i18n.t('noSave') })
    }
    if (state.schema.schema.properties.generalOptions) {
      await this.$axios.$post('/api/v1/contrib/paypal/configs/general', state.general)
    }
    if (state.schema.schema.properties.perLibraryOptions) {
      await this.$axios.$post('/api/v1/contrib/paypal/configs/library', state.libConfs)
    }
    commit('clean')
    commit('snackbar', { type: 'success', message: this.app.i18n.t('saved') })
  }
}

export const mutations = {
  general_confs (state, data) {
    state.clean = false
    state.general = data
  },
  library_confs (state, data) {
    state.clean = false
    state.libConfs = data
  },
  snackbar (state, data) {
    state.snackbar = data
  },
  clean (state) {
    state.clean = true
  }
}

// export const getters = {
//   configured_libraries (state) {
//     console.log(state)
//     const names = state.list.map(config => !config.library_id?{library_id: null, name: 'Default'}:state.libraries.list.filter(library => library.library_id == config.library_id).map(library))
//     return state.libraries.list.filter(library => configIds.includes(library.library_id))
//   }
// }
