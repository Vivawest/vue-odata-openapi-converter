<template>
  <div v-if="oasApiDocument" class="relative overflow-y-scroll">
    <div id="endPointReader" class="p-4">
      <h2>{{ oasApiDocument.info.title }}</h2>
      <span v-html="formatDescription(oasApiDocument.info.description)"></span>
      <div v-for="tag in allTags" :key="tag">
        <div id="tag" class="flex gap-3">
          <h3 v-if="isCopyMode || hasSelectedOperation(tag)" class="my-3">
            {{ tag }}
          </h3>
          <BaseCheckbox
            :id="tag"
            :name="tag"
            class="mr-2"
            :modelValue="selectedTags.includes(tag)"
            :disabled-icon="isTagNotFullyChecked(tag) ? 'mdi:minus' : ''"
            @click.stop="toggleTag(tag)"
          />
        </div>
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
                <template
                  v-if="
                    typeof method !== 'string' &&
                    'tags' in method &&
                    methodHasTag(method, tag)
                  "
                >
                  <CollapseContainer
                    v-if="
                      isCopyMode ||
                      selectedOperations[path]?.includes(operation)
                    "
                    :id="`collapse-container-${path}-${operation}`"
                    :title="operation.toUpperCase()"
                    class="flex gap-2 items-center mb-2"
                  >
                    <template #expandStart>
                      <BaseCheckbox
                        :id="`${path}-${operation}`"
                        :name="`${path}-${operation}`"
                        class="mr-2"
                        :modelValue="
                          selectedOperations[path]?.includes(operation)
                        "
                        @click.stop="addOrRemoveOperation(path, operation, tag)"
                      />
                    </template>
                    <template #expandTitle>
                      <ul class="flex gap-x-4 items-center flex-wrap w-full">
                        <li class="font-bold truncate">
                          {{ path }}
                        </li>
                        <li class="text-sm">{{ method.summary }}</li>
                      </ul>
                    </template>
                    <table
                      v-if="method.parameters || methods?.parameters"
                      class="flex flex-col m-4"
                    >
                      <tr class="flex border-b gap-8 p-2">
                        <th class="max-w-44 min-w-44">Name</th>
                        <th>Description</th>
                      </tr>
                      <div>
                        <template v-if="isParameterObject(method.parameters)">
                          <div
                            v-for="[index, param] in Object.entries(
                              method.parameters,
                            )"
                            :key="index"
                            class="group"
                          >
                            <tr
                              class="flex gap-8 items-center p-2 group-even:bg-gray-100"
                            >
                              <td class="flex flex-col max-w-44 min-w-44">
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
                                <span class="text-sm">({{ param.in }})</span>
                              </td>
                              <td class="flex flex-col">
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
                              </td>
                            </tr>
                          </div>
                        </template>
                        <template v-if="isParameterObject(methods?.parameters)">
                          <div
                            v-for="param in methods?.parameters"
                            :key="param?.name"
                            class="group"
                          >
                            <tr
                              class="flex gap-8 items-center p-2 text-sm group-even:bg-gray-100"
                            >
                              <td class="flex flex-col max-w-44 min-w-44">
                                <div class="flex gap-2">
                                  <strong class="font-bold text-base">
                                    {{ param.name }}
                                  </strong>
                                  <span
                                    v-if="param.required"
                                    class="text-xs text-red text-nowrap"
                                    style="color: red"
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
                              </td>
                              <td>{{ param.description }}</td>
                            </tr>
                          </div>
                        </template>
                      </div>
                    </table>
                    <div v-else class="mt-2">No parameters</div>
                  </CollapseContainer>
                </template>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>
    <div
      class="h-20 bg-gray-100 sticky bottom-0 border-t-2 flex items-center justify-between px-4"
    >
      <BaseCheckbox
        id="checkbox-all"
        name="checkbox-all"
        label="All"
        :modelValue="isAllChecked"
        :disabled-icon="isNotFullyChecked ? 'mdi:minus' : ''"
        @change="toggleAll()"
      />
      <div class="flex">
        <BaseButton class="text-nowrap" @click="copyToClipboard()">
          <Icon
            icon="material-symbols:content-copy-outline"
            class="size-6 mr-1"
          />
          <span v-if="isCopied">Copied!</span>
          <span v-else>Copy to Clipboard</span>
        </BaseButton>
        <BaseButton class="w-fit h-fit ml-4" @click="convertOpenApiData()">
          <Icon icon="ic:baseline-autorenew" class="size-6 mr-1" />
          Update OpenAPI
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import CollapseContainer from "./CollapseContainer.vue";
import type { OpenAPIV3_1 } from "openapi-types";
import BaseCheckbox from "./inputs/BaseCheckbox.vue";
import BaseButton from "./inputs/BaseButton.vue";
import { Icon } from "@iconify/vue";

const openApiData = defineModel<string | undefined>("modelValue");
const oasApiDocument = ref<OpenAPIV3_1.Document>();

const selectedOperations = ref<Record<string, string[]>>({});
const selectedTags = ref<string[]>([]);

const isAllChecked = computed(() => {
  const paths = oasApiDocument.value?.paths ?? {};
  return (
    Object.keys(selectedOperations.value).length === Object.keys(paths).length
  );
});

const isNotFullyChecked = computed(() => {
  return (
    Object.keys(selectedOperations.value).length !== 0 && !isAllChecked.value
  );
});

const allTags = computed(() => {
  const tags: string[] = [];

  const paths = oasApiDocument.value?.paths ?? {};
  for (const methods of Object.values(paths)) {
    if (!methods) continue;
    for (const method of Object.values(methods)) {
      if (typeof method === "object" && method !== null && "tags" in method) {
        for (const tag of method.tags ?? []) {
          if (!tags.includes(tag)) {
            tags.push(tag);
          }
        }
      }
    }
  }
  return tags;
});

function hasSelectedOperation(tag: string): boolean {
  const operation = getOperationsByTagName(tag);
  return operation.some(([path, operation]) =>
    selectedOperations.value[path]?.includes(operation),
  );
}

function isTagNotFullyChecked(tagName: string): boolean {
  const operation = getOperationsByTagName(tagName);
  const selected = operation.filter(([path, operation]) =>
    selectedOperations.value[path]?.includes(operation),
  );

  if (selected.length === 0) return false;
  return selected.length > 0 && selected.length < operation.length;
}

function getOperationsByTagName(tagName: string): [string, string][] {
  const paths = oasApiDocument.value?.paths;
  if (!paths) return [];

  const matchingOperations: [string, string][] = [];
  for (const [path, methods] of Object.entries(paths)) {
    if (!methods) continue;
    for (const [operation, method] of Object.entries(methods)) {
      if (methodHasTag(method, tagName)) {
        matchingOperations.push([path, operation]);
      }
    }
  }
  return matchingOperations;
}

function addTag(tagName: string) {
  selectedTags.value.push(tagName);
  const matchingOperations = getOperationsByTagName(tagName);

  matchingOperations.forEach(([path, operation]) => {
    const selectedOperation = selectedOperations.value[path] ?? [];
    if (!selectedOperation.includes(operation)) {
      selectedOperations.value[path] = [...selectedOperation, operation];
    }
  });
}

function removeTag(tagName: string) {
  selectedTags.value = selectedTags.value.filter((tag) => tag !== tagName);
  const matchingOperations = getOperationsByTagName(tagName);

  matchingOperations.forEach(([path, operation]) => {
    const selectedOperation = selectedOperations.value[path] ?? [];
    selectedOperations.value[path] = selectedOperation.filter(
      (operationInList) => operationInList !== operation,
    );
    if (selectedOperations.value[path].length === 0) {
      delete selectedOperations.value[path];
    }
  });
}

function toggleTag(tagName: string) {
  if (selectedTags.value.includes(tagName)) {
    removeTag(tagName);
  } else {
    addTag(tagName);
  }
}

const isCopied = ref(false);
const isCopyMode = ref(true);
async function copyToClipboard() {
  isCopyMode.value = false;
  await nextTick();

  const container = document.querySelector("#endPointReader");
  if (!container) {
    isCopyMode.value = true;
    return;
  }
  const clone = container.cloneNode(true) as HTMLElement;

  // Add styles to tables and cells
  clone.querySelectorAll("table, th, td").forEach((el) => {
    el.setAttribute("style", "border: 1px solid;");
  });

  const html = clone.innerHTML;
  const blob = new Blob([html], { type: "text/html" });
  const data = [new ClipboardItem({ "text/html": blob })];
  navigator.clipboard.write(data).then(() => {
    isCopied.value = true;
    isCopyMode.value = true;
  });
  setTimeout(() => (isCopied.value = false), 1500);
}

function convertOpenApiData() {
  if (!oasApiDocument.value) return;

  fetch("/api/process-openapi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      selectedOperations: selectedOperations.value,
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process OpenAPI data");
      }
      return response.json();
    })
    .then((data) => {
      openApiData.value = JSON.stringify(data.openapi);
    })
    .catch((error) => {
      console.error("Failed to convert OpenAPI data:", error);
    });
}

function addOrRemoveOperation(
  path: string,
  operation: string,
  tagName?: string,
) {
  const ops = selectedOperations.value[path] ?? [];
  const idx = ops.indexOf(operation);
  if (idx === -1) {
    selectedOperations.value[path] = [...ops, operation];
  } else {
    const newOps = [...ops];
    newOps.splice(idx, 1);
    if (newOps.length) {
      selectedOperations.value[path] = newOps;
    } else {
      delete selectedOperations.value[path];
    }
  }

  if (tagName) {
    const matchingOps = getOperationsByTagName(tagName);
    const anySelected = matchingOps.some(([p, op]) =>
      selectedOperations.value[p]?.includes(op),
    );
    if (anySelected && !isTagNotFullyChecked(tagName)) {
      if (!selectedTags.value.includes(tagName)) {
        selectedTags.value.push(tagName);
      }
    } else {
      selectedTags.value = selectedTags.value.filter((tag) => tag !== tagName);
    }
  }
}

function toggleAll() {
  selectedOperations.value = {};
  selectedTags.value = [];

  const paths = oasApiDocument.value?.paths;
  if (!isAllChecked.value) {
    for (const [path, methods] of Object.entries(paths ?? {})) {
      if (!methods) continue;
      for (const [operation, method] of Object.entries(methods)) {
        if (typeof method !== "string" && "tags" in method) {
          addOrRemoveOperation(path, operation);
        }
      }
    }
    selectedTags.value = allTags.value;
  }
}

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

function methodHasTag(method: unknown, tagName: string): boolean {
  if (
    typeof method === "object" &&
    method !== null &&
    "tags" in method &&
    Array.isArray(method.tags)
  ) {
    return method.tags?.includes(tagName);
  }
  return false;
}

function formatDescription(description?: string): string {
  if (!description) return "";

  return description.replace(
    /\[([^\]]+)\]\((http[^)]+)\)/g,
    '<a href="$2" target="_blank" class="text-blue-500 underline">$1</a>',
  );
}

onMounted(async () => {
  try {
    const response = await fetch("/api/process-openapi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to process OpenAPI data");
    }

    const data = await response.json();
    oasApiDocument.value = data.openapi as OpenAPIV3_1.Document;

    const paths = oasApiDocument.value?.paths;
    if (!paths) return;

    selectedOperations.value = {};
    for (const [path, methods] of Object.entries(paths)) {
      if (!methods) continue;
      for (const [operation, method] of Object.entries(methods)) {
        if (typeof method !== "string" && "tags" in method) {
          addOrRemoveOperation(path, operation);
        }
      }
    }

    selectedTags.value = [];
    selectedTags.value = allTags.value;
  } catch (err) {
    console.error("Failed to parse OpenAPI data:", err);
  }
});
</script>
