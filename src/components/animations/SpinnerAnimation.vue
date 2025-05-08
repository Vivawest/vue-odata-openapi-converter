<template>
  <div class="lds-ring">
    <div :class="borderWidth"></div>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    colorClass?: string;
    borderWidth?: string;
  }>(),
  { colorClass: "bg-petrol", borderWidth: "border-4" },
);
</script>

<style scoped>
.lds-ring {
  display: inline-block;
  position: relative;
}
.lds-ring div {
  @apply box-border;
  @apply block;
  @apply h-full;
  @apply w-full;
  border-top-color: var(--color-petrol, #55afc8);
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
