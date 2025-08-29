<template>
  <div
    class="vpr-pull-refresh"
    @mousedown="mouseDown"
    @mousemove="mouseMove"
    @mouseup="handleEnd"
    @mouseleave="handleEnd"
    @touchstart="touchStart"
    @touchmove="touchMove"
    @touchend="handleEnd"
    @touchcancel="handleEnd"
  >
    <div
      v-if="!props.disabled && state.status !== 'normal'"
      class="vpr-pull-refresh__header"
      :style="{
        height: props.headerHeight + 'px',
        transform: inlineStyle.headerTranslate,
        transition: inlineStyle.headerTransition,
      }"
    >
      <slot name="header" :status="state.status" :distance="state.distance">
        <div class="vpr-pull-refresh__header__txt">{{ statusText }}</div>
      </slot>
    </div>
    <div
      class="vpr-pull-refresh__scroll"
      ref="scrollerRef"
      :style="{
        transform: inlineStyle.scrollerTranslate,
        transition: inlineStyle.scrollerTransition,
      }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';

interface Props {
  modelValue: boolean;
  pullingText?: string;
  loosingText?: string;
  loadingText?: string;
  headerHeight?: number;
  animationDuration?: number;
  disabled?: boolean;
}

type PullStatus = 'normal' | 'pulling' | 'loosing' | 'loading';

interface Emits {
  (e: 'update:modelValue', v: boolean): void;
  (e: 'refresh'): void;
}

const scrollerRef = ref<HTMLDivElement>();

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  pullingText: '下拉即可刷新...',
  loosingText: '释放即可刷新...',
  loadingText: '加载中...',
  headerHeight: 64,
  animationDuration: 200,
  disabled: false,
});

const emit = defineEmits<Emits>();

const inlineStyle = reactive({
  scrollerTransition: '',
  scrollerTranslate: '',
  headerTransition: '',
  headerTranslate: '',
});

const state = reactive<{
  status: PullStatus;
  startY: number;
  pulling: boolean;
  distance: number;
}>({
  status: 'normal',
  startY: 0,
  pulling: false,
  distance: 0,
});

const statusText = computed(() => {
  switch (state.status) {
    case 'loading':
      return props.loadingText;
    case 'loosing':
      return props.loosingText;
    case 'pulling':
      return props.pullingText;
    default:
      return props.pullingText;
  }
});

/**
 * 阻尼函数
 */
function damp(dy: number): number {
  const maxY = props.headerHeight;
  const d = Math.max(0, dy);
  if (d <= maxY) return d;
  return maxY + Math.log2(d - maxY + 1) * 5;
}

function setOffset(y: number, animate = false) {
  state.distance = Math.max(0, y);
  inlineStyle.scrollerTransition = animate ? `transform ${props.animationDuration}ms ease` : 'none';
  inlineStyle.scrollerTranslate = `translate3d(0, ${state.distance}px, 0)`;
  inlineStyle.headerTransition = animate ? `transform ${props.animationDuration}ms ease` : 'none';
  inlineStyle.headerTranslate = `translate3d(0, ${state.distance - props.headerHeight}px, 0)`;
}

function updateHeaderPos(offset: number, refreshing: boolean) {
  if (refreshing) {
    state.status = 'loading';
    return;
  }
  if (offset >= props.headerHeight) state.status = 'loosing';
  else if (offset > 0) state.status = 'pulling';
  else state.status = 'normal';
}

function handleStart(y: number) {
  if (props.disabled) return;
  if (scrollerRef.value && scrollerRef.value.scrollTop <= 0) {
    state.pulling = true;
    state.startY = y;
    setOffset(0, false);
    updateHeaderPos(0, false);
  }
}

function handleMove(y: number, evt?: MouseEvent | TouchEvent) {
  if (!state.pulling) return;
  const dy = y - state.startY;
  if (dy > 0) {
    const off = damp(dy);
    evt?.preventDefault();
    setOffset(off, false);
    updateHeaderPos(off, false);
  } else {
    setOffset(0, true);
    state.pulling = false;
  }
}

function handleEnd() {
  if (!state.pulling) return;
  state.pulling = false;
  if (state.distance >= props.headerHeight) {
    setOffset(props.headerHeight, true);
    updateHeaderPos(state.distance, true);
    emit('update:modelValue', true);
    emit('refresh');
  } else {
    setOffset(0, true);
    updateHeaderPos(0, false);
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      setOffset(0, true);
      updateHeaderPos(0, false);
    }
  }
);

const mouseDown = (e: MouseEvent) => handleStart(e.clientY);
const mouseMove = (e: MouseEvent) => handleMove(e.clientY, e);
const touchStart = (e: TouchEvent) => handleStart(e.touches[0].clientY);
const touchMove = (e: TouchEvent) => handleMove(e.touches[0].clientY, e);

defineExpose({
  scroller: scrollerRef,
});
</script>

<style scoped>
.vpr-pull-refresh {
  position: relative;
  height: 100%;
  overflow: hidden;
  touch-action: pan-y;
}

.vpr-pull-refresh__scroll {
  position: relative;
  height: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.vpr-pull-refresh__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  will-change: transform;
}

.vpr-pull-refresh__header__txt {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
