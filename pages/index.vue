<script setup lang="ts">
const sections = [
  { to: '/contacts', title: 'Contacts', text: 'People, contact details, sponsors, and volunteers.' },
  { to: '/businesses', title: 'Businesses', text: 'Businesses and their attendance confirmations.' },
  { to: '/vendors', title: 'Vendors', text: 'Vendor applications, booths, and payments.' },
  { to: '/floats', title: 'Floats', text: 'Parade float registrations and confirmations.' },
]
</script>

<template>
  <section class="welcome-panel">
    <h1>Heritage Days Manager</h1>
    <p>Manage the people, businesses, vendors, and floats participating in Heritage Days.</p>
    <div class="dashboard-grid">
      <NuxtLink v-for="section in sections" :key="section.to" :to="section.to" class="dashboard-card">
        <h2>{{ section.title }}</h2>
        <p>{{ section.text }}</p>
        <span>Open {{ section.title }} →</span>
      </NuxtLink>
    </div>
  </section>
</template>
