<template>
  <div
    class="relative flex items-center gap-2"
    :class="disabled ? 'opacity-50' : 'cursor-pointer'"
  >
    <input
      :id
      type="checkbox"
      name="checkbox"
      class="peer size-6 absolute opacity-0"
      v-model="model"
      :disabled
    />
    <div
      class="size-6 border border-gray rounded-md flex items-center justify-center"
    >
      <Icon v-if="model" :icon class="text-petrol size-5" />
      <Icon
        v-if="disabledIcon && !model"
        :icon="disabledIcon"
        class="text-petrol size-5"
      />
    </div>
    <label v-if="label" :for="id" :class="labelClass">{{ label }}</label>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";

withDefaults(
  defineProps<{
    id: string;
    label?: string;
    labelClass?: string;
    disabled?: boolean;
    icon?: string;
    disabledIcon?: string;
  }>(),
  {
    labelClass: "peer-checked:font-semibold",
    icon: "mdi:check",
  },
);

const model = defineModel("modelValue", {
  type: Boolean,
});
</script>
