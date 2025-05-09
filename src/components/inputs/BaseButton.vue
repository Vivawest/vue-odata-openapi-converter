<template>
  <button
    class="transition-colors"
    :class="[
      {
        'opacity-50 pointer-events-none': disabled,
      },
      computedStyle,
    ]"
    :disabled="disabled"
  >
    <slot v-if="!isLoading"></slot>

    <template v-else>
      <SpinnerAnimation v-if="type === 'icon'" class="size-5" />
      <EllipsisAnimation
        v-else
        :color-class="type === 'primary' ? 'bg-white' : 'bg-petrol'"
      />
    </template>
  </button>
</template>
<script setup lang="ts">
import { computed } from "vue";
import EllipsisAnimation from "../animations/EllipsisAnimation.vue";
import SpinnerAnimation from "../animations/SpinnerAnimation.vue";

const props = withDefaults(
  defineProps<{
    type?: "primary" | "plain" | "icon" | "custom";
    disabled?: boolean;
    isLoading?: boolean;
  }>(),
  {
    type: "primary",
    disabled: false,
    isLoading: false,
  },
);

const computedStyle = computed(() => {
  switch (props.type) {
    case "plain":
      return "flex items-center min-h-10 text-petrol hover:text-petrol-700 hover:bg-petrol-200 px-3 py-1.5 rounded-md text-sm focus:text-gray focus:outline-hidden";
    case "icon":
      return "flex items-center justify-center rounded-full p-2 hover:bg-petrol-200 focus:outline-hidden";
    case "custom":
      return "flex items-center justify-center text-sm rounded-md";
    default:
      return "flex items-center justify-center min-h-10 px-3 py-1.5 bg-petrol text-white rounded-md hover:bg-petrol-600 active:bg-petrol-700";
  }
});
</script>
