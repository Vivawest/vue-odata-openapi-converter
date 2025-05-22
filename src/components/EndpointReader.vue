<template>
  <div class="p-4" v-if="oasApiDocument">
    <h1>{{ oasApiDocument.info.title }}</h1>
    <span v-html="formatDescription(oasApiDocument.info.description)"></span>
    <div v-for="tag in oasApiDocument.tags" :key="tag.name">
      <h3 class="my-4">{{ tag.name }}</h3>
      <template v-if="oasApiDocument?.paths">
        <div
          v-for="[path, methods] in Object.entries(oasApiDocument?.paths)"
          :key="path"
        >
          <template v-if="methods">
            <div
              v-for="[operation, method] in Object.entries(methods)"
              :key="operation"
            >
              <template v-if="typeof method !== 'string' && 'tags' in method">
                <CollapseContainer
                  v-if="method.tags?.includes(tag.name)"
                  :title="operation.toUpperCase()"
                  class="mb-2"
                >
                  <template #expandTitle>
                    <div class="flex gap-4 items-center">
                      <p class="font-bold">{{ path }}</p>
                      <p class="text-sm">{{ method.summary }}</p>
                    </div>
                  </template>
                  <div
                    v-if="method.parameters || methods?.parameters"
                    class="flex flex-col m-4"
                  >
                    <div class="flex border-b gap-8 p-2">
                      <span class="max-w-44 min-w-44">Name</span>
                      <span>Description</span>
                    </div>
                    <template v-if="isParameterObject(method.parameters)">
                      <div
                        v-for="[index, param] in Object.entries(
                          method.parameters,
                        )"
                        :key="index"
                      >
                        <div class="flex gap-8 items-center p-2">
                          <div class="flex flex-col max-w-44 min-w-44">
                            <span>{{ param.name }}</span>
                            <div
                              v-if="isArraySchemaObject(param.schema)"
                              class="flex text-sm"
                            >
                              <span>
                                {{ param.schema?.type }}
                              </span>
                              <span v-if="'type' in param.schema.items">
                                &lt;{{ param.schema.items.type }}&gt;
                              </span>
                            </div>
                            <p class="text-sm">({{ param.in }})</p>
                          </div>
                          <div class="flex flex-col">
                            <span
                              v-html="formatDescription(param.description)"
                            ></span>
                            <span v-if="param.example" class="text-sm">
                              Example: {{ param.example }}
                            </span>
                            <p
                              v-if="
                                isArraySchemaObject(param.schema) &&
                                'enum' in param.schema.items
                              "
                              class="text-sm"
                            >
                              Available values :
                              {{ param.schema.items.enum?.join(", ") }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </template>
                    <template v-if="isParameterObject(methods?.parameters)">
                      <div
                        v-for="param in methods?.parameters"
                        :key="param?.name"
                        class="flex gap-8 items-center p-2 text-sm"
                      >
                        <div class="flex flex-col max-w-44 min-w-44">
                          <div class="flex gap-2">
                            <span class="font-bold text-base">
                              {{ param.name }}</span
                            >
                            <span
                              v-if="param.required"
                              class="text-xs text-red text-nowrap"
                            >
                              * required
                            </span>
                          </div>
                          <div
                            v-if="isNonArraySchemaObject(param.schema)"
                            class="flex"
                          >
                            <span>{{ param.schema.type }}</span>
                            <span>({{ param.schema.format }})</span>
                          </div>
                          <span>{{ param.in }}</span>
                        </div>
                        <div>{{ param.description }}</div>
                      </div>
                    </template>
                  </div>
                  <div v-else class="mt-2">No parameters</div>
                </CollapseContainer>
              </template>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import CollapseContainer from "./CollapseContainer.vue";
import Oas from "oas";
import type { OAS31Document } from "oas/types";
import type { OpenAPIV3_1 } from "openapi-types";

const props = defineProps<{
  openApiData: string | undefined;
}>();

function isParameterObject(
  param?: unknown[],
): param is OpenAPIV3_1.ParameterObject[] {
  if (!param) return false;

  return param.every(
    (p) => typeof p === "object" && p !== null && "name" in p && "in" in p,
  );
}

function isArraySchemaObject(
  param?: unknown,
): param is OpenAPIV3_1.ArraySchemaObject {
  if (!param) return false;

  return (
    typeof param === "object" &&
    param !== null &&
    "items" in param &&
    "type" in param
  );
}

function isNonArraySchemaObject(
  param?: unknown,
): param is OpenAPIV3_1.NonArraySchemaObject {
  if (!param) return false;

  return (
    typeof param === "object" &&
    param !== null &&
    !("items" in param) &&
    "type" in param
  );
}

function formatDescription(description?: string): string {
  if (!description) return "";

  return description.replace(
    /\[([^\]]+)\]\((http[^)]+)\)/g,
    '<a href="$2" target="_blank" class="text-blue-500 underline">$1</a>',
  );
}

const oasApiDocument = ref<OpenAPIV3_1.Document>();

watch(
  () => props.openApiData,
  async () => {
    if (props.openApiData) {
      try {
        const response = await fetch("/process-openapi", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        const oas = new Oas(JSON.parse(data).dereferencedData.api);
        oasApiDocument.value = oas.api as OAS31Document;
      } catch (err) {
        console.error("Failed to parse OpenAPI data:", err);
      }
    } else {
      oasApiDocument.value = undefined;
    }
  },
  { immediate: true },
);
</script>
