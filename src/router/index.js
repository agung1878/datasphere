import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LocationDetail from '../views/LocationDetail.vue';
import StreamingDevice from '../views/StreamingDevice.vue';
import LoginView from '../views/LoginView.vue';
import { useAuthStore } from '../stores/auth';

const routes = [
    {
        // Set the root path to redirect to the login page
        path: '/',
        redirect: '/login'
    },
    {
        path: '/home',
        name: 'home',
        component: HomeView,
        meta: { requiresAuth: true }
    },
    {
        path: '/login',
        name: 'login',
        component: LoginView,
        meta: { requiresGuest: true }
    },
    {
        path: '/location/:id',
        name: 'location-detail',
        component: LocationDetail,
        props: true,
        meta: { requiresAuth: true }
    },
    {
        path: '/stream_device',
        name: 'stream-device',
        component: StreamingDevice,
        props: true,
        meta: { requiresAuth: true }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    // Check if route requires authentication
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        // Redirect to login if not authenticated
        next({ name: 'login' });
    }
    // Check if route is for guests only (like login page)
    else if (to.meta.requiresGuest && authStore.isAuthenticated) {
        // Redirect to home if already authenticated
        next({ name: 'home' });
    }
    else {
        // Allow navigation
        next();
    }
});

export default router;
