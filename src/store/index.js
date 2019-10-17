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

    let { data } = await this.$axios.$get('/api/v1/contrib/paypal/configs')
    if (!data) {
      // throw new Error('Could not get configuration list')
      data = { general: { PayPalSandboxMode: false }, libraries: [{ active: true, library_id: null }, { active: false, library_id: 'CPL' }] }
    }

    commit('general_confs', data.general)
    commit('library_confs', data.libraries)
  },
  async save ({ commit, state }) {
    if (state.clean) {
      return commit('snackbar', { type: 'info', message: 'There is nothing to save' })
    }
    if (state.schema.schema.properties.generalOptions) {
      await this.$axios.$post('/api/v1/contrib/paypal/configs/general', state.general)
    }
    if (state.schema.schema.properties.perLibraryOptions) {
      await this.$axios.$post('/api/v1/contrib/paypal/configs/library', state.libConfs)
    }
    commit('clean')
    commit('snackbar', { type: 'success', message: 'Configurations where saved' })
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
