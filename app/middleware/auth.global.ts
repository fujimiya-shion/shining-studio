export default defineNuxtRouteMiddleware(async (to) => {
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch
  const session = await requestFetch<{ authenticated: boolean }>('/api/auth/session')
  const isLoggedIn = session.authenticated

  if (to.path === '/login' && isLoggedIn) {
    return navigateTo('/list')
  }
})
