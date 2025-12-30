<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Eye, EyeOff } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Form fields
const email = ref('');
const password = ref('');
const showPassword = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleLogin = async (e) => {
  e.preventDefault();
  
  // Basic validation
  if (!email.value || !password.value) {
    authStore.error = 'Please enter both email and password';
    return;
  }

  const result = await authStore.login(email.value, password.value);
  
  if (result.success) {
    // Redirect to home on successful login
    router.push({ name: 'home' });
  }
  // Error is already set in the store
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
    
    <!-- Modal Content -->
    <div class="relative w-full max-w-5xl bg-[url(@/assets/img/bg_confirmation.png)] bg-no-repeat bg-[length:100%_100%] min-w-[1034px] min-h-[753px] border border-blue-900/80 rounded-xl shadow-[0_0_50px_rgba(30,58,138,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="flex items-end justify-end px-6 py-4">
        
      </div>

      <!-- Body -->
      <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-sm">
          <img class="mx-auto h-16 w-auto" src="@/assets/img/logo_icon.png" alt="DataSphere" />
          <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Sign in to your account</h2>
        </div>

        <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form class="space-y-6" @submit="handleLogin">
            <!-- Error Message -->
            <div v-if="authStore.error" class="rounded-md bg-red-900/20 border border-red-500/50 p-3">
              <p class="text-sm text-red-300">{{ authStore.error }}</p>
            </div>

            <div>
              <label for="email" class="block text-sm/6 font-medium text-gray-100">Email address</label>
              <div class="mt-2">
                <input 
                  v-model="email"
                  type="email" 
                  name="email" 
                  id="email" 
                  autocomplete="email" 
                  required 
                  :disabled="authStore.loading"
                  class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed" 
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between">
                <label for="password" class="block text-sm/6 font-medium text-gray-100">Password</label>
                <div class="text-sm">
                  <a href="#" class="font-semibold text-indigo-400 hover:text-indigo-300">Forgot password?</a>
                </div>
              </div>
              <div class="mt-2 relative">
                <input 
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'" 
                  name="password" 
                  id="password" 
                  autocomplete="current-password" 
                  required 
                  :disabled="authStore.loading"
                  class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed" 
                />
                <button 
                  type="button"
                  @click="togglePassword" 
                  class="absolute right-3 top-1/2 -translate-y-1/2"
                  :disabled="authStore.loading"
                >
                  <Eye v-if="showPassword" class="w-5 h-5 text-gray-500" />
                  <EyeOff v-else class="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div>
              <button 
                type="submit"
                :disabled="authStore.loading"
                class="flex w-full justify-center rounded-md bg-[#061B65] px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-[#2E58F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span v-if="authStore.loading">Signing in...</span>
                <span v-else>Sign in</span>
              </button>
            </div>
          </form>

          <p class="mt-10 text-center text-sm/6 text-gray-400">
            Create account?
            {{ ' ' }}
            <a href="#" class="font-semibold text-indigo-400 hover:text-indigo-300">Register</a>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-8 py-6 flex justify-center gap-4">
      </div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.5);
  border-radius: 2px;
}
</style>
