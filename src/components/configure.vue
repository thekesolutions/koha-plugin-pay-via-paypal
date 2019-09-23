<template>
  <h1>Configure</h1>
</template>

<script>
export default {
  name: 'Configure',
  async fetch ({ store, params }) {
    await store.dispatch('get_configs')
  }
}
</script>
