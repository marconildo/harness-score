<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';
import HomeLanding from './components/HomeLanding.vue';
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-features-after>
      <HomeLanding />
    </template>
  </DefaultTheme.Layout>
</template>
