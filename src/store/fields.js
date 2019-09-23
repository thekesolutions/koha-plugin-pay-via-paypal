import YAML from 'yaml'

export const state = () => ({
  list: []
})

export const actions = {
  async get_fields ({ commit }) {
    let { data } = await this.$axios.$get('/api/v1/contrib/paypal/static/fields')
    if (!data) {
      data = `
      general:
      -  PayPalSandboxMode:
          label: Sandbox mode?
          type: checkbox
      libraries:
      -  active:
          label: Is Active?
          type: checkbox
      -  user:
          label: PayPal user
          type: text
      -  pwd:
          label: PayPal password
          type: text
      -  signature:
          label: PayPal signature
          type: text
      -  charge_description:
          label: Charge description
          type: text
      -  threshold:
          label: Mimimum payment threshold
          type: number
      `
    }
    commit('set_fields', YAML.parse(data))
  }
}

export const mutations = {
  set_fields (state, data) {
    state.list = data
  }
}
