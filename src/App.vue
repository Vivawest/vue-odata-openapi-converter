<template>
  <div class="flex w-screen h-screen overflow-hidden p-2">
    <div class="flex-1/2 mx-4">
      <div class="flex flex-col gap-4">
        <BaseTextarea
          id="custom-headers"
          name="custom-headers"
          class="w-md"
          :rows="5"
          label="Custom Headers (JSON)"
          :borderColorClass="
            isCustomHeaderValid ? 'border-gray-300' : 'border-red-500'
          "
          :disabled="openApiData !== undefined"
          v-model="customHeaders"
        />
        <p v-if="!isCustomHeaderValid" class="text-red-500">
          Invalid JSON format in Custom Headers.
        </p>
        <BaseInput
          id="url-input"
          name="url-input"
          class="w-full"
          label="Odata URL"
          :disabled="openApiData !== undefined"
          v-model="url"
        />
        <p v-if="isUrlXmlConflict" class="text-red-500">
          Please provide either an OData URL or XML Data, not both.
        </p>
        <BaseTextarea
          id="xml-data"
          name="xml-data"
          class="w-full"
          :rows="5"
          label="XML Data"
          :disabled="openApiData !== undefined"
          v-model="xmlData"
        />
        <p v-if="isUrlXmlConflict" class="text-red-500">
          Please provide either an OData URL or XML Data, not both.
        </p>
        <div class="flex gap-4">
          <BaseButton
            class="w-fit"
            :disabled="isConvertDisabled"
            @click="convertToOpenApi()"
          >
            Convert to OpenAPI
          </BaseButton>
          <BaseButton class="w-fit h-fit" @click="handleClear()">
            Clear all
          </BaseButton>
        </div>
      </div>
      <div v-if="isLoading || openApiData" class="border my-5"></div>
      <div v-if="openApiData" class="flex flex-col gap-2">
        <div class="flex gap-2">
          <BaseButton class="w-38" @click="copyToClipboard(openApiData)">
            <span v-if="isCopied">Copied!</span>
            <span v-else>Copy to Clipboard</span>
          </BaseButton>
          <BaseButton class="w-fit" @click="downloadOpenApi(openApiData)">
            Download OpenAPI
          </BaseButton>
        </div>
        <BaseTextarea
          id="open-api-data"
          name="open-api-data"
          disabled
          :rows="16"
          v-model="openApiData"
        />
      </div>
      <SpinnerAnimation
        v-else-if="isLoading"
        borderWidth="border-24"
        class="size-96 self-center"
      />
      <p v-else class="text-red-500">{{ errorMessage }}</p>
    </div>
    <EndpointReader class="overflow-auto w-full border-l" :openApiData />
  </div>
</template>

<script setup lang="ts">
import BaseButton from "@/components/inputs/BaseButton.vue";
import BaseInput from "@/components/inputs/BaseInput.vue";
import BaseTextarea from "@/components/inputs/BaseTextarea.vue";
import { ref, computed } from "vue";
import SpinnerAnimation from "./components/animations/SpinnerAnimation.vue";
import EndpointReader from "./components/EndpointReader.vue";

const url = ref<string | undefined>(undefined);
const xmlData = ref<string | undefined>(undefined);
const openApiData = ref<string | undefined>(undefined);
const customHeaders = ref<string | undefined>(undefined);
const errorMessage = ref<string | undefined>(undefined);

function handleClear() {
  url.value = undefined;
  xmlData.value = undefined;
  openApiData.value = undefined;
  customHeaders.value = undefined;
  errorMessage.value = undefined;
}

const isCustomHeaderValid = computed(() => {
  if (customHeaders.value?.trim()) {
    try {
      JSON.parse(customHeaders.value);
    } catch {
      return false;
    }
  }
  return true;
});

const isUrlXmlConflict = computed(
  () => url.value && xmlData.value && !openApiData.value && !isLoading.value,
);

const isConvertDisabled = computed(() => {
  const noInputProvided = !xmlData.value && !url.value;

  return (
    noInputProvided ||
    isUrlXmlConflict.value ||
    isLoading.value ||
    !!openApiData.value
  );
});

const isCopied = ref(false);
function copyToClipboard(data: string) {
  navigator.clipboard
    .writeText(data)
    .then(() => {
      isCopied.value = true;
      setTimeout(() => {
        isCopied.value = false;
      }, 1000);
    })
    .catch((err) => {
      errorMessage.value = "Failed to copy to clipboard.";
      console.error(err);
    });
}

function downloadOpenApi(data: string) {
  const blob = new Blob([data], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "openapi.json";
  link.click();
  window.URL.revokeObjectURL(url);
}

const isLoading = ref(false);
async function convertToOpenApi() {
  isLoading.value = true;
  errorMessage.value = "";

  const response = await fetch("/convert-to-openapi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Custom-Headers": JSON.stringify(customHeaders.value ?? ""),
    },
    body: JSON.stringify({
      url: url.value ?? "",
      xmlData: xmlData.value ?? "",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    errorMessage.value = errorData.error || "An error occurred";
    isLoading.value = false;
    return;
  }

  const data = await response.json();
  openApiData.value = data.openapi;
  if (url.value) xmlData.value = data.xmlData;
  isLoading.value = false;
}
</script>
