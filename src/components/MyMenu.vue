<template>
  <n-menu :options="menuOptions" />
</template>

<script lang="ts" setup>
import type { MenuOption } from 'naive-ui'


import menu from '../router/menu';
const menuOptions: MenuOption[] = menu.reduce((pre, cur) => {
  pre.push({
    label: cur.name,
    key: cur.name,
  })
  return pre
}, [] as MenuOption[])
</script>

<style lang="scss" scoped></style>