<template>
  <div>
    <canvas @click="onClick" ref="flappy" width="414" height="896"></canvas>
  </div>
</template>

<script>
// import ExpoTHREE, { THREE } from 'expo-three';
import * as THREE from 'three';

export default {
  name: 'SpriteView',
  props: {
    onClick: {
      type: Function,
      required: true
    },
    update: {
      type: Function,
      required: true
    },
    onSetup: {
      type: Function,
      required: true
    }
  },
  data () {
    return {
      scene: null,
      camera: null,
      worldSpaceWidth: 750 * .3333333,
      worldSpaceHeight: null
    }
  },
  async mounted () {
    const canvas = this.$refs.flappy;
    // canvas.style.width ='100%';
    // canvas.style.height='100%';
    // // ...then set the internal size to match
    // canvas.width  = canvas.offsetWidth;
    // canvas.height = canvas.offsetHeight;
    //const context = canvas.getContext('2d');
    this.scene = new THREE.Scene();
    this.worldSpaceHeight = (canvas.height/ canvas.width) * this.worldSpaceWidth;

    this.camera = new THREE.OrthographicCamera(
      this.worldSpaceWidth / -2,
      this.worldSpaceWidth / 2,
      this.worldSpaceWidth / 2,
      this.worldSpaceWidth / -2,
      0,
      1
    );
    this.scene.size = {
      width: this.worldSpaceWidth,
      height: this.worldSpaceHeight
    };
    this.scene.bounds = {
      top: this.camera.top,
      left: this.camera.left,
      bottom: this.camera.bottom,
      right: this.camera.right
    };
    this.camera.position.z = 1;
    const renderer = new THREE.WebGLRenderer({canvas: canvas});
    renderer.setSize(canvas.width, canvas.height);
    //renderer.setClearColor(0x000000, 0);

    await this.onSetup({scene: this.scene, camera: this.camera});

    let lastFrameTime;
    const render = () => {
      const now = 0.001 * performance.now();
      const dt = typeof lastFrameTime !== 'undefined'
      ? now -lastFrameTime : 0.166666;
      window.requestAnimationFrame(render);
      this.update(dt);
      renderer.render(this.scene, this.camera);
      lastFrameTime = now;
    };

    render();
  },
  methods: {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
