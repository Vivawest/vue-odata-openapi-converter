<template>
    <div
        class="flex rounded-lg p-3 w-full flex-col bg-white border-white-300"
        :class="shadowStyle"
    >
        <div
            class="flex text-gray hover:cursor-pointer items-center w-full flex-wrap"
            @click="toggleCollapse"
        >
            <div class="flex gap-2 items-center">
                <Icon
                    icon="ic:baseline-play-arrow"
                    class="size-6"
                    :class="{ 'rotate-90': !isCollapsed }"
                />
                <h2 class="text-gray text-lg" :class="titleStyle">
                    {{ title }}
                </h2>
            </div>
            <div class="flex justify-between grow">
                <slot name="expandTitle" :isCollapsed><div></div></slot>
                <slot name="expandEnd" :isCollapsed></slot>
            </div>
        </div>
        <Transition name="collapse">
            <div v-if="!isCollapsed">
                <slot></slot>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref } from 'vue';

withDefaults(
    defineProps<{ title: string; titleStyle?: string; shadowStyle?: string }>(),
    {
        titleStyle: 'w-40 text-nowrap truncate',
        shadowStyle: 'shadow-custom shadow-md border',
    }
);

const emit = defineEmits(['opened', 'closed']);
const isCollapsed = ref(true);

const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
    isCollapsed.value ? emit('closed') : emit('opened');
};

defineExpose({ toggleCollapse });
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
    transition: max-height 0.3s ease-out;
    max-height: 1000px;
    overflow: auto;
}
.collapse-enter-from,
.collapse-leave-to {
    max-height: 0;
    overflow: hidden;
}
</style>
