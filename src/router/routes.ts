import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '/',
        component: () => import('pages/IndexPage.vue'),
      },

      {
        path: '/collection/:id',
        name: 'collection',
        component: () => import('pages/CollectionsPage.vue'),
        props: (to) => ({
          id: to.params.id,
          name: to.query.name,
        }),
      },
    ],
  },
  {
    name: 'view-chat',
    path: '/chat/:chatId',
    component: () => import('pages/ViewChatPage.vue'),
    props: true,
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
