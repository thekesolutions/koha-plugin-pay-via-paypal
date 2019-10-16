export const state = () => ({
  general: {},
  libConfs: [],
  saved: false,
  clean: true
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

    commit('set_general_confs', data.general)
    commit('set_library_confs', data.libraries)
  },
  async save ({ commit }, data) {

  }
}

export const mutations = {
  set_general_confs (state, data) {
    state.general = data
  },
  set_library_confs (state, data) {
    state.libConfs = data
  }
}

// export const getters = {
//   configured_libraries (state) {
//     console.log(state)
//     const names = state.list.map(config => !config.library_id?{library_id: null, name: 'Default'}:state.libraries.list.filter(library => library.library_id == config.library_id).map(library))
//     return state.libraries.list.filter(library => configIds.includes(library.library_id))
//   }
// }
