export default defineNuxtRouteMiddleware(async () => {
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch
  const session = await requestFetch<{ authenticated: boolean }>('/api/auth/session')

  if (!session.authenticated) {
    return navigateTo('/login')
  }
})
