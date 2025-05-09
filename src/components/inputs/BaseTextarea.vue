<template>
  <div class="relative last:flex flex-col gap-0.5">
    <label
      v-if="label"
      :for="id"
      class="pointer-events-none"
      :class="labelClass"
      >{{ label }}</label
    >
    <textarea
      :id
      class="text-gray border rounded-[10px] px-3 py-1.5 w-full placeholder:text-gray placeholder:opacity-40 focus:outline-petrol"
      :class="[
        backgroundColorClass,
        borderColorClass,
        {
          'opacity-50': disabled,
          'pl-5': $slots.icon,
        },
      ]"
      :name
      v-model="model"
      :placeholder
      :disabled
      :rows
      :maxlength
      :autofocus
      @blur="$emit('blur-sm')"
    >
    </textarea>
    <div
      v-if="$slots.icon"
      class="absolute top-6 py-2 px-1 text-gray opacity-40"
    >
      <slot name="icon"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string;
    name: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    backgroundColorClass?: string;
    borderColorClass?: string;
    rows?: number;
    maxlength?: number;
    labelClass?: string;
    autofocus?: boolean;
  }>(),
  {
    placeholder: undefined,
    disabled: false,
    backgroundColorClass: "bg-white",
    borderColorClass: "border-gray-300",
    rows: 2,
    maxlength: undefined,
    labelClass: "text-black",
  },
);

const model = defineModel("modelValue", {
  type: String,
});

defineEmits<{
  (event: "blur-sm"): void;
}>();
</script>
