<template>
  <div>
    <header>
      <b-navbar toggleable="md" type="light" variant="light">
        <b-navbar-brand to="/">Vue-Flappy</b-navbar-brand>
      </b-navbar>
    </header>
    <div class="text-center">
      <SpriteView
      :onClick="click"
      :update="updateGame"
      :onSetup="onSetup" />
      <div>
        <p>{{score}}</p>
      </div>
    </div>

  </div>
</template>

<script>

import { Group, Node, Sprite } from '@/GameKit/index.js';
import SpriteView from './SpriteView';
import Files from '@/Files.js';
// import { THREE } from 'expo-three';
import * as THREE from 'three';

const SPEED = 1.5;
const GRAVITY = 1100;
const FLAP = 320;
const SPAWN_RATE = 2600;
const OPENING = 120;
const GROUND_HEIGHT = 64;

export default {
  name: 'GameLanding',
  components: {
    SpriteView
  },
  data () {
    return {
      scale: 1,
      player: null,
      scene: null,
      pillarInterval: null,
      groundNode: null,
      pipes: new Group(),
      deadPipeTops: [],
      deadPipeBottoms: [],
      gameStarted: false,
      gameOver: false,
      velocity: 0,
      score: 0
    }
  },
  beforeMount () {
    // THREE.suppressExpoWarnings(true);
  },
  methods: {
    setupPlayer: async function() {
      const size = {
        width: 22.5 * this.scale,
        height: 15 * this.scale
      };
      const sprite = new Sprite();
      await sprite.setup({
        image: Files.sprites.bird,
        tilesHoriz: 3,
        tilesVert: 1,
        numTiles: 3,
        tileDispDuration: 75,
        size
      });

      this.player = new Node({sprite});
      this.scene.add(this.player);
    },
    setupGround: async function() {
      const {scene} = this;
      const size = {
        width: scene.size.width,
        height: scene.size.width * 0.5
      };
      this.groundNode = new Group();
      const node = await this.setupStaticNode({
        image: Files.sprites.ground,
        size,
        name: 'ground'
      });
      const nodeB = await this.setupStaticNode({
        image: Files.sprites.ground,
        size,
        name: 'ground'
      });
      nodeB.x = size.width;

      this.groundNode.add(node);
      this.groundNode.add(nodeB);

      this.groundNode.position.y =
      (scene.size.height + (size.height - GROUND_HEIGHT)) * -.5;

      this.groundNode.top = this.groundNode.position.y + size.height / 2;

      this.groundNode.position.z = 0.01;
      scene.add(this.groundNode);
    },
    setupBackground: async function() {
      const { scene } = this;
      const { size } = scene;
      const bg = await this.setupStaticNode({
        image: Files.sprites.bg,
        size,
        name: 'bg',
      });

      scene.add(bg);
    },
    setupPipe: async function({key, y}) {
      const size = { width: 52, height: 200 };

      const tbs = {
        top: Files.sprites.pipe_top,
        bottom: Files.sprites.pipe_bottom,
      };
      const pipe = await this.setupStaticNode({
        image: tbs[key],
        size,
        name: key,
      });
      pipe.y = y;

      return pipe;
    },
    setupStaticNode: async function({image, size, name, scale}) {
      scale = scale || this.scale;
      // @(Evan Bacon): Initialize empty sprite element
      const sprite = new Sprite();

      // @(Evan Bacon): Setup static sprite
      await sprite.setup({
        image,
        size: {
          width: size.width * scale,
          height: size.height * scale,
        },
      });

      // @(Evan Bacon): Build node with sprite
      const node = new Node({
        sprite,
      });
      node.name = name;
      return node;
    },
    spawnPipe: async function(openPos, flipped) {
      let pipeY;
      if (flipped) {
        pipeY = Math.floor(openPos - OPENING / 2 - 320);
      } else {
        pipeY = Math.floor(openPos + OPENING / 2);
      }
      let pipeKey = flipped ? 'bottom' : 'top';
      let pipe;

      const end = this.scene.bounds.right + 26;
      if (this.deadPipeTops.length > 0 && pipeKey === 'top') {
        pipe = this.deadPipeTops.pop().revive();
        pipe.reset(end, pipeY);
      } else if (this.deadPipeBottoms.length > 0 && pipeKey === 'bottom') {
        pipe = this.deadPipeBottoms.pop().revive();
        pipe.reset(end, pipeY);
      } else {
        pipe = await this.setupPipe({
          scene: this.scene,
          y: pipeY,
          key: pipeKey,
        });
        pipe.x = end;

        this.pipes.add(pipe);
      }
      pipe.velocity = -SPEED;
      return pipe;
    },
    spawnPipes: function() {
      this.pipes.forEachAlive(pipe => {
        //@(Evan Bacon) If any pipes are off screen then we want to flag them as "dead" so we can recycle them!
        if (pipe.size && pipe.x + pipe.size.width < this.scene.bounds.left) {
          if (pipe.name === 'top') {
            this.deadPipeTops.push(pipe.kill());
          }
          if (pipe.name === 'bottom') {
            this.deadPipeBottoms.push(pipe.kill());
          }
        }
      });

      //@(Evan Bacon) Get a random spot for the center of the two pipes.
      const pipeY =
        this.scene.size.height / 2 +
        (Math.random() - 0.5) * this.scene.size.height * 0.3333333;
      //@(Evan Bacon) Spawn both pipes around this point.
      this.spawnPipe(pipeY);
      this.spawnPipe(pipeY, true);
    },
    click: function() {
      if (!this.gameStarted) {
        this.gameStarted = true;
        // @(Evan Bacon) here we build a timer to spawn pipes
        this.pillarInterval = setInterval(this.spawnPipes, SPAWN_RATE);
      }

      if (!this.gameOver) {
        // @(Evan Bacon) These are in-game taps for making the bird flap
        this.velocity = FLAP;
        // this.audio.wing();
      } else {
        // @(Evan Bacon) This is an end-game tap to reset the game
        this.reset();
      }
    },
    addScore: function() {
      this.score++;
    },
    setGameOver: function() {
      this.gameOver = false;
      clearInterval(this.pillarInterval);
      //maybe some "YOU LOSE" Animation
      this.reset();
      return;
    },
    reset: function() {
      this.gameStarted = false;
      this.gameOver = false;
      this.score = 0;

      this.player.reset(this.scene.size.width * -0.3, 0);
      this.player.angle = 0;
      this.pipes.removeAll();
    },
    onSetup: async function({scene}) {
      this.scene = scene;
      this.scene.add(this.pipes);
      await this.setupBackground();
      await this.setupGround();
      await this.setupPlayer();

      this.reset();
    },
    updateGame: function(delta) {
      if(this.gameStarted){
        this.velocity -= GRAVITY * delta;
        const target = this.groundNode.top;
        if(!this.gameOver){
          const playerBox = new THREE.Box3().setFromObject(this.player);
          this.pipes.forEachAlive(pipe => {
            pipe.x += pipe.velocity;
            const pipeBox = new THREE.Box3().setFromObject(pipe);
            if(pipeBox.intersectsBox(playerBox)){
              this.setGameOver();
            }
            if(pipe.name === 'bottom'
            && !pipe.passed && pipe.x < this.player.x){
              pipe.passed = true;
              this.addScore();
            }
          });

          this.player.angle = Math.min(
            Math.PI /4, Math.max(-Math.PI / 2, (FLAP + this.velocity) / FLAP)
          );

          if(this.player.y <= target){
            this.setGameOver();
          }
          this.player.update(delta);
        }

        if(this.player.y <= target){
          this.player.angle = -Math.PI / 2;
          this.player.y = target;
          this.velocity = 0;
        }
        else {
          this.player.y += this.velocity * delta;
        }
      }
      else {
        this.player.update(delta);
        this.player.y = 8 * Math.cos(Date.now() / 200);
        this.player.angle = 0;
      }

      if (!this.gameOver) {
        //@(Evan Bacon) This is where we do the floor looping animation
        this.groundNode.children.map((node, index) => {
          node.x -= SPEED;
          //@(Evan Bacon) If the floor component is off screen then get the next item and move it behind that.
          if (node.x < this.scene.size.width * -1) {
            let nextIndex = index + 1;
            if (nextIndex === this.groundNode.children.length) {
              nextIndex = 0;
            }
            const nextNode = this.groundNode.children[nextIndex];
            node.x = nextNode.x + this.scene.size.width - 1.55;
          }
        });
      }
    }
  }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
