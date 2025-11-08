<template>
	<div
		ref="rootRef"
		class="vpr-pull-refresh"
		@mousedown="mouseDown"
		@mousemove="mouseMove"
		@mouseup="handleEnd"
		@mouseleave="handleEnd">
		<div
			class="vpr-pull-refresh-wrap"
			:style="{
				transform: inlineStyle.scrollerTranslate,
				transition: inlineStyle.scrollerTransition
			}">
			<div
				v-if="!props.disabled"
				class="vpr-pull-refresh__header"
				:style="{
					height: props.headerHeight + 'px'
				}">
				<slot name="header" :status="state.status" :distance="state.distance">
					<div class="vpr-pull-refresh__header__txt">{{ statusText }}</div>
				</slot>
			</div>
			<div class="vpr-pull-refresh__scroll" :class="state.status" ref="scrollerRef">
				<slot />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';

interface Props {
	modelValue: boolean;
	pullingText?: string;
	loosingText?: string;
	loadingText?: string;
	headerHeight?: number;
	animationDuration?: number;
	damping?: number;
	disabled?: boolean;
}

type PullStatus = 'normal' | 'pulling' | 'loosing' | 'loading';

interface Emits {
	(e: 'update:modelValue', v: boolean): void;
	(e: 'refresh'): void;
}

const rootRef = ref<HTMLDivElement>();
const scrollerRef = ref<HTMLDivElement>();

const props = withDefaults(defineProps<Props>(), {
	modelValue: false,
	pullingText: '下拉即可刷新...',
	loosingText: '释放即可刷新...',
	loadingText: '加载中...',
	headerHeight: 64,
	animationDuration: 200,
	damping: 0.6,
	disabled: false
});

const emit = defineEmits<Emits>();

const inlineStyle = reactive({
	scrollerTransition: '',
	scrollerTranslate: ''
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
	distance: 0
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

	const extra = d - maxY;
	const scale = 1;
	const actualK = (props.damping * scale) / maxY;
	const resistance = 1 + actualK * extra;
	return maxY + extra / resistance;
}

function setOffset(y: number, animate = false) {
	state.distance = Math.max(0, y);
	inlineStyle.scrollerTransition = animate ? `transform ${props.animationDuration}ms ease` : 'none';
	inlineStyle.scrollerTranslate = `translate3d(0, ${state.distance}px, 0)`;
}

function updateHeaderPos(offset: number, refreshing: boolean) {
	if (refreshing) state.status = 'loading';
	else if (offset >= props.headerHeight) state.status = 'loosing';
	else if (offset > 0) state.status = 'pulling';
	else state.status = 'normal';
}

function handleStart(y: number) {
	if (props.modelValue || props.disabled) return;
	if (scrollerRef.value && scrollerRef.value.scrollTop <= 0) {
		state.pulling = true;
		state.startY = y;
		setOffset(0, false);
		updateHeaderPos(0, false);
	}
}

function handleMove(y: number, evt?: MouseEvent | TouchEvent) {
	if (!state.pulling) return;
	if (props.modelValue || props.disabled) return;
	const dy = y - state.startY;
	if (dy > 0) {
		const off = damp(dy);
		evt?.preventDefault();
		setOffset(off, false);
		updateHeaderPos(off, false);
	} else {
		setOffset(0, true);
		state.status = 'normal';
	}
}

function handleEnd() {
	if (!state.pulling) return;
	if (props.modelValue || props.disabled) return;
	if (state.distance >= props.headerHeight) {
		setOffset(props.headerHeight, true);
		updateHeaderPos(state.distance, true);
		emit('update:modelValue', true);
		emit('refresh');
		state.pulling = false;
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

onMounted(() => {
	const el = rootRef.value;
	if (el) {
		el.addEventListener('touchstart', touchStart, { passive: true });
		el.addEventListener('touchmove', touchMove, { passive: false });
		el.addEventListener('touchend', handleEnd, { passive: true });
		el.addEventListener('touchcancel', handleEnd, { passive: true });
	}
});

onBeforeUnmount(() => {
	const el = rootRef.value;
	if (el) {
		el.removeEventListener('touchstart', touchStart);
		el.removeEventListener('touchmove', touchMove);
		el.removeEventListener('touchend', handleEnd);
		el.removeEventListener('touchcancel', handleEnd);
	}
});
</script>

<style scoped>
@import url('./pull-refresh.css');
</style>
