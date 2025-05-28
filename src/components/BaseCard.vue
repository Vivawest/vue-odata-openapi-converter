<template>
  <div
    class="flex flex-col gap-1 w-full tall:gap-0 rounded-lg border border-white-300"
    :class="[cardStyle, cardShadowClass, { 'py-1': isCompressed }]"
  >
    <div v-if="isLoading">
      <card-skeleton />
    </div>
    <div v-else class="h-full">
      <div v-if="$slots.header" class="flex justify-between items-center">
        <slot name="header"></slot>
      </div>
      <div class="h-full">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import CardSkeleton from "./animations/CardSkeleton.vue";

withDefaults(
  defineProps<{
    isLoading?: boolean;
    isCompressed?: boolean;
    cardStyle?: string;
    cardShadowClass?: string;
  }>(),
  {
    isLoading: false,
    isCompressed: false,
    cardStyle: "bg-white p-4",
    cardShadowClass: "shadow-gray-300 shadow-md",
  },
);
</script>
