<script setup lang="ts">
</script>
<template>
  <n-notification-provider>
    <NotificationGlobal />
  </n-notification-provider>
  <n-message-provider>
    <MessageGlobal />
  </n-message-provider>
  <n-dialog-provider>
    <DialogGlobal />
  </n-dialog-provider>
  <n-layout style="height: 100vh" has-sider>
    <n-layout-sider content-style="padding: 10px;" :width="200" :native-scrollbar="false" bordered>
      <MyMenu></MyMenu>
    </n-layout-sider>
    <router-view></router-view>
  </n-layout>
</template>
<style lang="scss">

</style>
