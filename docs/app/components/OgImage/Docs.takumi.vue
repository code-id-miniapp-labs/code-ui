<script setup lang="ts">
defineOptions({
  inheritAttrs: false
})

defineProps<{
  headline?: string
  title?: string
  description?: string
}>()
</script>

<template>
  <div
    class="w-full h-full flex bg-neutral-950 relative overflow-hidden font-sans"
    data-theme="dark"
  >
    <div class="absolute top-0 left-0 w-1.5 h-full bg-[#e62024]" />

    <div class="flex flex-col justify-between flex-1 px-20 py-16">
      <div />

      <div class="flex flex-col gap-5">
        <span
          v-if="headline"
          class="text-2xl font-medium text-[#f87171]"
        >
          {{ headline }}
        </span>

        <h1
          v-if="title"
          class="text-6xl font-bold text-highlighted"
        >
          {{ title }}
        </h1>

        <p
          v-if="description"
          class="text-3xl/11 text-muted"
          :style="{ lineClamp: 2, textOverflow: 'ellipsis' }"
        >
          {{ description }}
        </p>
      </div>

      <div class="flex items-center gap-4">
        <img
          src="/logo-mark.png"
          alt="Code UI"
          class="size-8 w-auto shrink-0"
        >
        <span class="font-lexend text-2xl font-bold text-[#e62024]">Code UI</span>
        <div class="h-px flex-1 bg-border" />
        <span class="text-xl text-dimmed">https://github.com/code-id-miniapp-labs/code-ui</span>
      </div>
    </div>
  </div>
</template>
