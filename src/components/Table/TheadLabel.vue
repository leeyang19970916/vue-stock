<template>
  <div>
    <button v-if="sortable" type="button" @click="updateSort">
      {{ label }}
      <template v-if="model.key === key">
        {{ model.direction === "asc" ? "↑" : "↓" }}
      </template>
    </button>
    <template v-else>
      {{ label }}
    </template>
  </div>
</template>
<script setup lang="ts">
import { SORT_STATE } from "@/constants";
import type { Col, SortState } from "@/types/table";

const props = defineProps<{
  col: Col;
}>();
const { sortable, label, key } = props.col;
const model = defineModel<SortState>({ default: SORT_STATE });

const isSortableColKey = (key: Col["key"]): key is SortState["key"] =>
  key !== "trend";

const updateSort = () => {
  if (!isSortableColKey(key)) {
    return;
  }

  if (model.value.key === key) {
    model.value.direction = model.value.direction === "asc" ? "desc" : "asc";
    return;
  }

  model.value = {
    key,
    direction: "asc",
  };
};
</script>
