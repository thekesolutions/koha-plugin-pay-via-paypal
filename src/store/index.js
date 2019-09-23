export const state = () => ({
  list: [],
  saved: false,
  clean: true
})

export const actions = {
  async get_configs ({ commit, dispatch }) {
    let { data } = await this.$axios.$get('/api/v1/contrib/paypal/configs')
    if (!data) {
      // throw new Error('Could not get configuration list')
      data = [{ library_id: null }, { library_id: 'CPL' }]
    }
    if (!data.length) {
      data.push({ library_id: null })
    }
    commit('init', data)
    dispatch('fields/get_fields')
    dispatch('libraries/get_libraries')
  },
  async save ({ commit }, data) {

  }
}

export const mutations = {
  init (state, data) {
    state.list = data
  }
}

// export const getters = {
//   configured_libraries (state) {
//     console.log(state)
//     const names = state.list.map(config => !config.library_id?{library_id: null, name: 'Default'}:state.libraries.list.filter(library => library.library_id == config.library_id).map(library))
//     return state.libraries.list.filter(library => configIds.includes(library.library_id))
//   }
// }
