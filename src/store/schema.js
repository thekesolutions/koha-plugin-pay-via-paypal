import YAML from 'yaml'
import koha_api from '~/koha-api.json'

export const state = () => ({
    schema: {}
})

export const actions = {
    async get_schema({ commit }) {
        let data = await this.$axios.$get(koha_api.path + '/static/schema/schema.yaml')

        data = data.replace(/\{\{([\w.]+)\}\}/g, (str, p1) => {
            const trans = this.app.i18n.t(p1)
            return trans
        })
        commit('set_fields', YAML.parse(data))
    }
}

export const mutations = {
    set_fields(state, data) {
        state.schema = data
    }
}
