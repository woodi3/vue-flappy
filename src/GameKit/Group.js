
// import { THREE } from 'expo-three';

import * as THREE from 'three';

export default class Group extends THREE.Group {
  constructor({ ...props }) {
    super(props);
  }

  removeAll = () => {
    while (this.children.length) {
      this.remove(this.children[0]);
    }
  };

  forEachAlive = (callback) => {
    this.traverse(function(node) {
      if (node.alive) {
        callback(node);
      }
    });
  };
}
