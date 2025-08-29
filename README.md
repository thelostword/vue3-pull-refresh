# vue3-pull-refresh

一个基于 **Vue3** 的下拉刷新组件，支持鼠标拖拽 & 触摸手势，适用于移动端/PC。
轻量、无依赖，支持自定义头部内容。

🔹 安装

```bash
npm install vue3-pull-refresh

# 或者

yarn add vue3-pull-refresh
```

🔹 基本使用

```vue
<template>
  <PullRefresh v-model="loading" @refresh="loadData">
    <div v-for="item in list" :key="item.id">{{ item.text }}</div>
  </PullRefresh>
</template>

<script setup>
import { ref } from 'vue';
import PullRefresh from 'vue3-pull-refresh';

const loading = ref(false);
const list = ref([{ id: 1, text: '数据 1' }]);

async function loadData() {
  loading.value = true;
  await new Promise((r) => setTimeout(r, 1000));
  list.value.unshift({ id: Date.now(), text: '新数据' });
  loading.value = false;
}
</script>
```

🔹 Props

| 属性                | 类型      | 默认值              | 说明                              |
| ------------------- | --------- | ------------------- | --------------------------------- |
| `modelValue`        | `Boolean` | `false`             | 刷新状态，使用 `v-model` 双向绑定 |
| `pullingText`       | `String`  | `'下拉即可刷新...'` | 下拉状态文案                      |
| `loosingText`       | `String`  | `'释放即可刷新...'` | 超过阈值松手文案                  |
| `loadingText`       | `String`  | `'加载中...'`       | 刷新中文案                        |
| `headerHeight`      | `Number`  | `64`                | 触发刷新所需拉动距离（px）        |
| `animationDuration` | `Number`  | `200`               | 位移动画时间（ms）                |
| `disabled`          | `Boolean` | `false`             | 禁用下拉刷新                      |

🔹 事件

| 事件                | 参数      | 说明                                                 |
| ------------------- | --------- | ---------------------------------------------------- |
| `refresh`           | 无        | 当下拉距离超过阈值并松手时触发，由父组件控制刷新逻辑 |
| `update:modelValue` | `Boolean` | 同步刷新状态，父组件通过 `v-model` 接收              |

🔹 插槽

| 名称      | 说明                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| `default` | 内容区域，必须提供滚动内容                                                         |
| header    | 自定义头部，可以获取状态：`status`（`normal` / `pulling` / `loosing` / `loading`） |

示例：

```vue
<PullRefresh v-model="loading">
  <template #header="{ status }">
    <div v-if="status === 'loading'">刷新中...</div>
    <div v-else-if="status === 'loosing'">松手刷新</div>
    <div v-else>下拉刷新</div>
  </template>

  <div v-for="item in list" :key="item.id">{{ item.text }}</div>
</PullRefresh>
```

🔹 注意事项

1. 组件依赖 Vue 3，请确保项目环境正确。
2. 通过 v-model 控制刷新状态，父组件负责完成异步操作后将 modelValue 设置为 false，组件才会复位。
3. 默认触发刷新距离为 64px，可通过 headerHeight 调整。
