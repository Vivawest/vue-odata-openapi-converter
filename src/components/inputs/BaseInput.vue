<template>
  <div class="flex flex-col gap-2">
    <div
      class="relative flex-col flex gap-3"
      :class="{ 'opacity-50': disabled }"
    >
      <label
        v-if="label"
        :for="id"
        class="pointer-events-none"
        :class="labelClass"
        >{{ label }}</label
      >
      <input
        :id
        :maxlength
        :name
        :type
        :placeholder
        :min
        :max
        :disabled
        :readonly
        :autofocus
        :accept
        ref="inputElement"
        class="text-gray bg-white focus:outline-petrol w-full rounded-[10px] border px-3 py-1.5 file:hidden placeholder:text-gray-400"
        :class="[
          {
            'pl-11': $slots.icon,
            'pr-7': $slots.iconAppend,
            'bg-white-300': disabled,
            'border-red-600': autoValidate ? !isValid : invalid,
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none':
              disableArrow,
          },
          backgroundColorClass,
          borderColorClass,
        ]"
        v-model="model"
        @focus="$emit('focus', $event)"
        @keydown.enter="$emit('keydown.enter', $event)"
        @change="validateInput"
      />
      <Icon
        v-if="type === 'password'"
        :icon="isPasswordVisible ? 'mdi:eye-off-outline' : 'mdi:eye-outline'"
        class="absolute bottom-2 right-3 flex h-5 w-5 items-center text-gray justify-center bg-white-300"
        @click="togglePasswordVisibility"
      />
      <div
        v-if="$slots.icon"
        class="absolute bottom-0 left-1 flex size-10 items-center justify-center"
      >
        <slot name="icon"></slot>
      </div>
      <div
        v-if="$slots.iconAppend"
        class="absolute bottom-2 right-3 flex size-5 items-center justify-center"
      >
        <slot name="iconAppend"></slot>
      </div>
    </div>
    <div
      v-if="invalid && invalidMessage"
      class="text-red-600 text-sm font-medium flex gap-1 items-start"
    >
      <Icon
        icon="material-symbols:error-outline"
        class="text-red-500 size-4 shrink-0 mt-[3px]"
      />
      {{ invalidMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { nextTick, ref, watch } from "vue";
import { z } from "zod";

const props = withDefaults(
  defineProps<{
    id: string;
    name: string;
    label?: string;
    modelValue?: string | number | Date | File;
    placeholder?: string;
    autofocus?: boolean;
    type?: "text" | "number" | "date" | "file" | "email" | "password";
    disabled?: boolean;
    backgroundColorClass?: string;
    borderColorClass?: string;
    readonly?: boolean;
    maxlength?: number;
    autoValidate?: boolean;
    invalid?: boolean;
    invalidMessage?: string;
    accept?: string;
    labelClass?: string;
    disableArrow?: boolean;
    max?: number;
    min?: number | string;
  }>(),
  {
    label: undefined,
    type: "text",
    placeholder: undefined,
    modelValue: undefined,
    disabled: false,
    autofocus: false,
    backgroundColorClass: "bg-white",
    borderColorClass: "border-gray-300",
    maxlength: undefined,
    autoValidate: true,
    invalid: false,
    labelClass: "text-black",
    disableArrow: false,
  },
);

const model = defineModel("modelValue");

const emit = defineEmits<{
  (event: "focus", value: FocusEvent): void;
  (event: "keydown.enter", value: KeyboardEvent): void;
  (event: "update:isValid", value: boolean): void;
}>();

const inputElement = ref<HTMLInputElement>();
const isPasswordVisible = ref(false);

function togglePasswordVisibility() {
  if (inputElement.value) {
    isPasswordVisible.value = !isPasswordVisible.value;
    inputElement.value.type =
      inputElement.value.type === "password" ? "text" : "password";
  }
}

const isValid = ref(true);

const inputValidationSchema = {
  email: z.string().email(),
  password: z.string().min(8),
  number: z.number(),
  date: z.date(),
  text: z.string(),
  file: z.instanceof(File),
};

function validateInput() {
  isValid.value = true;
  try {
    if (inputElement.value) {
      const value = inputElement.value.value;
      if (value === "" || value === null || value === undefined) {
        isValid.value = true;
        return;
      }
      let parsedValue;
      switch (props.type) {
        case "file":
          const files = inputElement.value?.files;
          parsedValue = files ? files[0] : null;
          break;
        case "number":
          parsedValue = Number(value);
          break;
        case "date":
          parsedValue = new Date(value);
          break;
        default:
          parsedValue = value;
      }
      inputValidationSchema[
        props.type as keyof typeof inputValidationSchema
      ].parse(parsedValue);
      isValid.value = true;
    }
  } catch (err) {
    isValid.value = false;
  }
}

watch(model, (newValue) => {
  if (
    props.type === "number" &&
    props.max !== undefined &&
    Number(newValue) > props.max
  ) {
    model.value = props.max;
  }
});

watch(isValid, () => {
  emit("update:isValid", isValid.value);
});

nextTick(() => {
  if (props.autofocus) {
    inputElement.value?.focus();
  }
});
</script>
