import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LocationDetail from '../views/LocationDetail.vue';
import StreamingDevice from '../views/StreamingDevice.vue';
import LoginView from '../views/LoginView.vue';

const routes = [
     {
      // Set the root path to redirect to the login page
      path: '/',
      redirect: '/login' 
    },
    {
        path: '/home',
        name: 'home',
        component: HomeView
    },
    {
        path: '/login',
        name: 'login',
        component: LoginView
    },
    {
        path: '/location/:id',
        name: 'location-detail',
        component: LocationDetail,
        props: true
    },
    {
        path: '/stream_device',
        name: 'stream-device',
        component: StreamingDevice,
        props: true
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
