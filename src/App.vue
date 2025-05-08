<template>
  <div class="flex flex-col gap-4 mt-2">
    <div class="flex w-full px-20 justify-between">
      <div></div>
      <!-- TODO: Fix header problems -->
      <!-- <BaseTextarea
        id="custom-headers"
        name="custom-headers"
        class="w-96"
        :rows="3"
        label="Custom Headers (JSON)"
        v-model="customHeaders"
      /> -->
      <BaseButton class="w-fit h-fit" @click="handleClear()"> Clear all</BaseButton>
    </div>
    <!-- TODO: Fix url problems -->
    <!-- <div class="flex w-screen h-full justify-center items-end gap-4 px-20">
      <BaseInput id="url-input" name="url-input" class="w-full" label="Odata URL" v-model="url" />
      <BaseButton class="w-fit h-fit" :disabled="!url" @click="handleClick()"> Ok </BaseButton>
    </div> -->
    <div class="flex w-screen items-end px-20 gap-4">
      <BaseTextarea
        id="xml-data"
        name="xml-data"
        class="w-full"
        :rows="5"
        label="XML Data"
        v-model="xmlData"
      />
      <BaseButton class="h-fit w-fit" :disabled="!xmlData" @click="handleClick(true)">
        Ok
      </BaseButton>
    </div>
  </div>
  <div v-if="isLoading || openApiData" class="border mx-10 my-5"></div>
  <div class="flex flex-col w-screen px-20 gap-2">
    <div v-if="openApiData" class="flex flex-col gap-2">
      <div class="flex gap-2">
        <BaseButton class="w-38" @click="copyToClipboard(openApiData)">
          <span v-if="isCopied">Copied!</span>
          <span v-else>Copy to Clipboard</span>
        </BaseButton>
        <BaseButton class="w-fit" @click="downloadOpenApi(openApiData)"
          >Download OpenAPI</BaseButton
        >
      </div>
      <BaseTextarea
        id="open-api-data"
        name="open-api-data"
        disabled
        :rows="20"
        v-model="openApiData"
      />
    </div>
    <SpinnerAnimation v-if="isLoading" borderWidth="border-24" class="size-96 self-center" />
    <div v-if="errorMessage">
      <span>
        <p class="text-red-500">{{ errorMessage }}</p>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseButton from "@/components/inputs/BaseButton.vue";
import BaseInput from "@/components/inputs/BaseInput.vue";
import BaseTextarea from "@/components/inputs/BaseTextarea.vue";
import { ref } from "vue";
import SpinnerAnimation from "./components/animations/SpinnerAnimation.vue";

const url = ref("");
const xmlData = ref("");
const openApiData = ref("");
const customHeaders = ref("");
const errorMessage = ref("");

function handleClear() {
  url.value = "";
  xmlData.value = "";
  openApiData.value = "";
  customHeaders.value = "";
  errorMessage.value = "";
}

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

async function convertToOpenApi() {
  try {
    const response = await fetch("/convert-to-openapi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xmlData: xmlData.value }),
    });

    if (!response.ok) {
      errorMessage.value = `Error: ${response.statusText}`;
      return;
    }

    const data = await response.json();
    openApiData.value = data.openapi;
  } catch (error) {
    errorMessage.value = error;
  }
}

const isLoading = ref(false);
async function handleClick(isXML: boolean = false) {
  isLoading.value = true;
  errorMessage.value = "";

  let parsedHeaders = {};
  try {
    parsedHeaders = customHeaders.value?.trim() ? JSON.parse(customHeaders.value) : {};
  } catch (error) {
    errorMessage.value = error;
    isLoading.value = false;
    return;
  }

  if (!isXML) {
    try {
      const response = await fetch(url.value, {
        method: "GET",
        headers: parsedHeaders,
      });
      const text = await response.text();
      xmlData.value = text;
    } catch (error) {
      errorMessage.value = error;
      isLoading.value = false;
      return;
    }
  }

  if (xmlData.value) await convertToOpenApi();

  isLoading.value = false;
}
</script>
