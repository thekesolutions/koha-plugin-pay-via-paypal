export const state = () => ({
  list: []
})

export const actions = {
  async get_libraries ({ commit }) {
    let { data } = await this.$axios.$get('/api/v1/libraries')
    if (!data) {
      data = JSON.parse(`[
        { "address1":"Jefferson Summit","address2":null,"address3":null,"city":null,"country":null,"email":null,"fax":null,"geolocation":null,"ip":null,"library_id":"CPL","marc_org_code":null,"name":"Centerville","notes":null,"opac_info":null,"phone":null,"pickup_location":true,"postal_code":null,"reply_to_email":null,"return_path_email":null,"state":null,"url":null },
{ "address1":"River Station","address2":null,"address3":null,"city":null,"country":null,"email":null,"fax":null,"geolocation":null,"ip":null,"library_id":"FFL","marc_org_code":null,"name":"Fairfield","notes":null,"opac_info":null,"phone":null,"pickup_location":true,"postal_code":null,"reply_to_email":null,"return_path_email":null,"state":null,"url":null },
{ "address1":"Hickory Squere","address2":null,"address3":null,"city":null,"country":null,"email":null,"fax":null,"geolocation":null,"ip":null,"library_id":"FPL","marc_org_code":null,"name":"Fairview","notes":null,"opac_info":null,"phone":null,"pickup_location":true,"postal_code":null,"reply_to_email":null,"return_path_email":null,"state":null,"url":null },
{ "address1":"Smith Heights","address2":null,"address3":null,"city":null,"country":null,"email":null,"fax":null,"geolocation":null,"ip":null,"library_id":"FRL","marc_org_code":null,"name":"Franklin","notes":null,"opac_info":null,"phone":null,"pickup_location":true,"postal_code":null,"reply_to_email":null,"return_path_email":null,"state":null,"url":null },
{ "address1":"","address2":null,"address3":null,"city":null,"country":null,"email":null,"fax":null,"geolocation":null,"ip":null,"library_id":"IPT","marc_org_code":null,"name":"Institut Protestant de Théologie","notes":null,"opac_info":null,"phone":null,"pickup_location":true,"postal_code":null,"reply_to_email":null,"return_path_email":null,"state":null,"url":null },
{ "address1":"East Hills","address2":null,"address3":null,"city":null,"country":null,"email":null,"fax":null,"geolocation":null,"ip":null,"library_id":"LPL","marc_org_code":null,"name":"Liberty","notes":null,"opac_info":null,"phone":null,"pickup_location":true,"postal_code":null,"reply_to_email":null,"return_path_email":null,"state":null,"url":null },
{ "address1":"372 Forest Street","address2":null,"address3":null,"city":null,"country":null,"email":null,"fax":null,"geolocation":null,"ip":null,"library_id":"MPL","marc_org_code":null,"name":"Midway","notes":null,"opac_info":null,"phone":null,"pickup_location":true,"postal_code":null,"reply_to_email":null,"return_path_email":null,"state":null,"url":null },
{ "address1":"Meadow Grove","address2":null,"address3":null,"city":null,"country":null,"email":null,"fax":null,"geolocation":null,"ip":null,"library_id":"PVL","marc_org_code":null,"name":"Pleasant Valley","notes":null,"opac_info":null,"phone":null,"pickup_location":true,"postal_code":null,"reply_to_email":null,"return_path_email":null,"state":null,"url":null },
{ "address1":"Johnson Terrace","address2":null,"address3":null,"city":null,"country":null,"email":null,"fax":null,"geolocation":null,"ip":null,"library_id":"RPL","marc_org_code":null,"name":"Riverside","notes":null,"opac_info":null,"phone":null,"pickup_location":true,"postal_code":null,"reply_to_email":null,"return_path_email":null,"state":null,"url":null },
{ "address1":"Highland Boulevard","address2":null,"address3":null,"city":null,"country":null,"email":null,"fax":null,"geolocation":null,"ip":null,"library_id":"SPL","marc_org_code":null,"name":"Springfield","notes":null,"opac_info":null,"phone":null,"pickup_location":true,"postal_code":null,"reply_to_email":null,"return_path_email":null,"state":null,"url":null },
{ "address1":"Valley Way","address2":null,"address3":null,"city":null,"country":null,"email":null,"fax":null,"geolocation":null,"ip":null,"library_id":"TPL","marc_org_code":null,"name":"Troy","notes":null,"opac_info":null,"phone":null,"pickup_location":true,"postal_code":null,"reply_to_email":null,"return_path_email":null,"state":null,"url":null },
{ "address1":"Chestnut Hollow","address2":null,"address3":null,"city":null,"country":null,"email":null,"fax":null,"geolocation":null,"ip":null,"library_id":"UPL","marc_org_code":null,"name":"Union","notes":null,"opac_info":null,"phone":null,"pickup_location":true,"postal_code":null,"reply_to_email":null,"return_path_email":null,"state":null,"url":null }
      ]`)
    }
    data.unshift({ library_id: null, name: 'Default' })
    commit('set_libraries', data)
  }
}

export const mutations = {
  set_libraries (state, data) {
    state.list = data
  }
}
