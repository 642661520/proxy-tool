<template>
  <n-menu :options="menuOptions" />
</template>

<script lang="ts" setup>
import type { MenuOption } from 'naive-ui'


import menu from '../router/menu';
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const menuOptions: MenuOption[] = menu.reduce((pre, cur) => {
  pre.push({
    label: t(`message.${cur.name}`),
    key: cur.name,
  })
  return pre
}, [] as MenuOption[])
</script>

<style lang="scss" scoped></style>