<script setup lang="ts">
import { cloneDeep } from "lodash-es";
import { onMounted, ref, Ref, watch } from "vue";
const { ipcRenderer } = require("electron");

const defaultProxyItem: ProxyItem = {
  Name: undefined,
  path: "/",
  target: undefined,
  changeOrigin: true,
  rewrite: {
    enable: false,
    value: [undefined, undefined],
  },
};
const defaultProxyDataItem: ProxyDataItem = {
  proxy: [cloneDeep(defaultProxyItem)],
  enable: false,
  port: undefined,
  Name: undefined,
}
const proxyData: Ref<ProxyData> = ref([]);
const enable = ref(false);


const state: Ref<State> = ref([]);

const loading = ref(false);

const clearObj = (obj: ProxyData | ProxyDataItem | Proxy | ProxyItem | Array<string | number> | undefined | boolean | number | string, defV = undefined) => {
  if (obj instanceof Array) {
    obj.forEach((item) => {
      clearObj(item);
    });
  } else if (obj?.constructor === Object) {
    if (typeof obj === "object") {
      Object.keys(obj).forEach((item) => {
        obj[item] = defV;
      });
    }
  }
};
const nextUuidKey = () => {
  return new Date().getTime().toString() + Math.random()
}
const handleAddPort = () => {
  const data = cloneDeep(defaultProxyDataItem);
  data.uuidKey = nextUuidKey();
  data.proxy[0].uuidKey = nextUuidKey();
  proxyData.value.push(cloneDeep(data));
};
const handleDelPort = (index: number) => {
  clearObj(proxyData.value[index]);
  proxyData.value.splice(index, 1);
};

const handleAddPath = (index: number) => {
  const data = cloneDeep(defaultProxyItem);
  data.uuidKey = nextUuidKey();
  proxyData.value[index].proxy.push(cloneDeep(data));
};
const handleDelPath = (index: number, i: number) => {
  clearObj(proxyData.value[index].proxy[i]);
  proxyData.value[index].proxy.splice(i, 1);
};

const handleSaveAndStart = () => {
  ipcRenderer.send("set-proxy", cloneDeep(proxyData.value));
};
const handleCloseProxy = () => {
  ipcRenderer.send("close-proxy");
};
const handleGetProxyData = async () => {
  loading.value = true;
  clearObj(proxyData.value);
  const data = await ipcRenderer.invoke("get-proxy");
  proxyData.value = data;
  loading.value = false;
};

onMounted(async () => {
  ipcRenderer.on("update-state", (_event: any, value: State) => {
    value.forEach(({ port, code, msg, Name, uuidKey }) => {
      // 0:正常 1: 异常 -1 :未启用
      if (code === 0) {
        window.$message.success(`名称【${Name}】端口【${port}】启动成功！`);
      } else if (code === 1) {
        window.$notification.error({
          title: ` 端口 [${port}] 启动失败！`,
          meta: new Date().toString().split("GMT")[0],
          content: msg,
          description: `名称：${Name} id:${uuidKey}`
        });
      } else {
        window.$message.info(`名称【${Name}】端口【${port}】未启用`);
      }
    });
    clearObj(state.value);
    state.value = value;
    enable.value = value.length ? true : false;
  });
  await handleGetProxyData();
  state.value = await ipcRenderer.invoke("get-state");
  if (state.value.length) {
    enable.value = true;
  }

});
</script>


<template>
  <n-layout style="height: 100vh">
    <n-layout-header style="padding: 10px;" bordered>
      <n-space justify="space-between" align="center">
        <n-space justify="space-between" align="center">
          <!-- <h3>{{ $t("message.hello") }}</h3> -->
          <h3>
            当前状态：<n-button strong secondary round :type="enable ? 'success' : 'error'">{{ enable ? "运行" : "停止" }}
            </n-button>
          </h3>
        </n-space>
        <n-space>
          <n-button type="primary" size="medium" @click="handleGetProxyData">重置表单</n-button>
          <n-button type="primary" size="medium" @click="handleCloseProxy" :disabled="!enable">关闭</n-button>
          <n-button type="primary" size="medium" @click="handleSaveAndStart">保存并运行</n-button>
        </n-space>
      </n-space>
    </n-layout-header>
    <n-layout position="absolute" style="top: 90px; bottom: 64px;" content-style="padding: 10px;"
      :native-scrollbar="false">
      <n-form label-placement="left" :show-feedback="false">
        <n-collapse>
          <n-space vertical :size="12">
            <n-alert v-for="(proxies, index) in proxyData" :key="'proxies' + index"
              :type="enable && state.find((v) => v.uuidKey === proxies.uuidKey && v.code === 0) ? 'success' : 'default'"
              :show-icon="false">
              <n-collapse-item>
                <template #header>
                  <n-space>
                    <n-form-item label="名称" @click.stop label-width="54px">
                      <n-input v-model:value="proxies.Name" placeholder="请输入名称" />
                    </n-form-item>
                    <n-form-item label="端口号" @click.stop label-width="54px">
                      <n-input-number v-model:value="proxies.port" style="width: 179px" placeholder="请输入端口号" />
                    </n-form-item>
                  </n-space>
                </template>
                <template #header-extra>
                  <n-space style="margin-right: 14px">
                    <n-form-item @click.stop>
                      <n-button @click="handleDelPort(index)">删除</n-button>
                    </n-form-item>
                    <n-form-item label="开关" @click.stop>
                      <n-switch v-model:value="proxies.enable" />
                    </n-form-item>
                  </n-space>
                </template>
                <n-collapse>
                  <n-space vertical :size="12">
                    <n-alert v-for="(proxy, i) in proxies.proxy" :key="'proxy' + index"
                      :type="proxy.path && (state.find(v => v.uuidKey === proxies.uuidKey && v.code === 0)?.path || []).includes(proxy.path) ? 'success' : 'default'"
                      :show-icon="false">
                      <n-collapse-item style="margin-left: 0">
                        <template #header>
                          <n-space>
                            <n-form-item label="名称" @click.stop>
                              <n-input v-model:value="proxy.Name" placeholder="请输入名称" />
                            </n-form-item>
                            <n-form-item label="路径" label-width="54px">
                              <n-input @click.stop v-model:value="proxy.path" placeholder="路径（例：/api）" />
                            </n-form-item>
                          </n-space>
                        </template>
                        <template #header-extra>
                          <n-space>
                            <n-form-item @click.stop>
                              <n-button @click="handleDelPath(index, i)">删除</n-button>
                            </n-form-item>
                            <n-form-item label="开关">
                              <n-switch @click.stop v-model:value="proxy.enable" />
                            </n-form-item>
                          </n-space>
                        </template>
                        <n-space>
                          <n-form-item label="跨域允许">
                            <n-switch @click.stop v-model:value="proxy.changeOrigin" placeholder="跨域允许" />
                          </n-form-item>
                          <n-form-item label="代理目标" style="width: 507px">
                            <n-input @click.stop v-model:value="proxy.target" placeholder="代理目标" />
                          </n-form-item>
                        </n-space>
                        <br />
                        <n-space v-if="proxy.rewrite">
                          <n-form-item label="重写开关">
                            <n-switch @click.stop v-model:value="proxy.rewrite.enable" />
                          </n-form-item>
                          <n-form-item v-if="proxy.rewrite.enable && proxy.rewrite.value" label="匹配规则">
                            <n-input @click.stop v-model:value="proxy.rewrite.value[0]" placeholder="匹配规则" />
                          </n-form-item>
                          <n-form-item v-if="proxy.rewrite.enable && proxy.rewrite.value" label="重写路径">
                            <n-input @click.stop v-model:value="proxy.rewrite.value[1]" placeholder="重写路径" />
                          </n-form-item>
                        </n-space>
                      </n-collapse-item>
                    </n-alert>
                    <n-form-item>
                      <n-button type="primary" size="medium" @click="handleAddPath(index)">新增路径</n-button>
                    </n-form-item>
                  </n-space>
                </n-collapse>
              </n-collapse-item>
            </n-alert>
            <n-form-item>
              <n-button type="primary" size="medium" @click="handleAddPort">新增端口</n-button>
            </n-form-item>
          </n-space>
        </n-collapse>
      </n-form>
    </n-layout>
    <n-layout-footer position="absolute" style="height: 64px; padding: 24px" bordered></n-layout-footer>

  </n-layout>
</template>