// Vue imports
import Vue from 'vue'
import Router from 'vue-router'



// our own imports
import GameLanding from '@/views/GameLanding'


Vue.use(Router)

let router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'GameLanding',
      component: GameLanding
    }
  ]
})

export default router
