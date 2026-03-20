<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

definePageMeta({
  name: 'timeline',
  path: '/package-timeline/:org?/:packageName/v/:version',
})

const route = useRoute('timeline')

const packageName = computed(() =>
  route.params.org ? `${route.params.org}/${route.params.packageName}` : route.params.packageName,
)
const version = computed(() => route.params.version)

const { data: pkg } = usePackage(packageName)

const latestVersion = computed(() => {
  if (!pkg.value) return null
  const latestTag = pkg.value['dist-tags']?.latest
  if (!latestTag) return null
  return pkg.value.versions[latestTag] ?? null
})

const versionUrlPattern = computed(() => {
  const split = packageName.value.split('/')
  const org = split.length === 2 ? split[0] : undefined
  const name = split.length === 2 ? split[1]! : split[0]!
  return `/package-timeline/${org ? `${org}/` : ''}${name}/v/{version}`
})

function timelineRoute(ver: string): RouteLocationRaw {
  return { name: 'timeline', params: { ...route.params, version: ver } }
}

// Build chronological version list sorted newest-first
const PAGE_SIZE = 25

const timelineEntries = computed(() => {
  if (!pkg.value) return []
  const time = pkg.value.time
  const versions = Object.keys(pkg.value.versions)

  return versions
    .filter(v => time[v])
    .map(v => ({
      version: v,
      time: time[v]!,
      tags: Object.entries(pkg.value!['dist-tags'] ?? {})
        .filter(([, ver]) => ver === v)
        .map(([tag]) => tag),
    }))
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
})

const visibleCount = ref(PAGE_SIZE)

const visibleEntries = computed(() => timelineEntries.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < timelineEntries.value.length)

function loadMore() {
  visibleCount.value += PAGE_SIZE
}

useSeoMeta({
  title: () => `Timeline - ${packageName.value} - npmx`,
  description: () => `Version timeline for ${packageName.value}`,
})
</script>

<template>
  <main class="flex-1 flex flex-col min-h-0">
    <PackageHeader
      :pkg="pkg"
      :resolved-version="version"
      :display-version="pkg?.requestedVersion"
      :latest-version="latestVersion"
      :version-url-pattern="versionUrlPattern"
      page="timeline"
    />

    <div class="container w-full py-8">
      <!-- Timeline -->
      <ol v-if="visibleEntries.length" class="relative border-s border-border ms-4">
        <li v-for="entry in visibleEntries" :key="entry.version" class="mb-6 ms-6">
          <!-- Dot -->
          <span
            class="absolute -start-2 flex items-center justify-center w-4 h-4 rounded-full border border-border"
            :class="entry.version === version ? 'bg-accent border-accent' : 'bg-bg-subtle'"
          />
          <!-- Content -->
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <LinkBase
              :to="timelineRoute(entry.version)"
              class="text-sm font-medium"
              :class="entry.version === version ? 'text-accent' : ''"
              dir="ltr"
            >
              {{ entry.version }}
            </LinkBase>
            <span
              v-for="tag in entry.tags"
              :key="tag"
              class="text-3xs font-semibold uppercase tracking-wide"
              :class="tag === 'latest' ? 'text-accent' : 'text-fg-subtle'"
            >
              {{ tag }}
            </span>
            <DateTime
              :datetime="entry.time"
              class="text-xs text-fg-subtle"
              year="numeric"
              month="short"
              day="numeric"
            />
          </div>
        </li>
      </ol>

      <!-- Load more -->
      <div v-if="hasMore" class="mt-4 ms-10">
        <button
          type="button"
          class="text-sm text-accent hover:text-accent/80 transition-colors"
          @click="loadMore"
        >
          {{ $t('package.timeline.load_more') }}
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="!pkg" class="py-20 text-center">
        <span class="i-svg-spinners:ring-resize w-5 h-5 text-fg-subtle" />
      </div>
    </div>
  </main>
</template>
