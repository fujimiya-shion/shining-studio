<script setup lang="ts">
const email = ref('')
const password = ref('')
const isSubmitting = ref(false)

const toast = useToast()

async function signIn() {
  if (isSubmitting.value) {
    return
  }

  if (!email.value.trim() || !password.value) {
    toast.add({
      title: 'Missing credentials',
      description: 'Enter both email and password.',
      color: 'error'
    })
    return
  }

  isSubmitting.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value.trim(),
        password: password.value
      }
    })
    await navigateTo('/list')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid email or password.'
    toast.add({
      title: 'Sign in failed',
      description: message,
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_26%),linear-gradient(180deg,#eff4ff_0%,#f8fafc_40%,#eef2ff_100%)] px-4 py-8">
    <section class="w-full max-w-md rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_26px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
      <div class="mb-6">
        <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">
          Secure Access
        </p>
        <h1 class="font-display mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Sign in to Shining Studio
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          Use your Supabase account email and password to continue.
        </p>
      </div>

      <form
        class="space-y-4"
        @submit.prevent="signIn"
      >
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            placeholder="you@example.com"
            required
          >
        </label>

        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            placeholder="Your password"
            required
          >
        </label>

        <button
          type="submit"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 font-medium text-white shadow-[0_16px_32px_rgba(20,184,166,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="isSubmitting"
        >
          <UIcon
            v-if="isSubmitting"
            name="i-lucide-loader-circle"
            class="size-4 animate-spin"
          />
          <UIcon
            v-else
            name="i-lucide-log-in"
            class="size-4"
          />
          <span>{{ isSubmitting ? 'Signing in...' : 'Sign in' }}</span>
        </button>
      </form>
    </section>
  </main>
</template>
