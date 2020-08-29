import React, { Component } from "react";

import unionFind from "../../helpers/unionFind";
import * as THREE from "three";

export default class Grid3D extends Component {
  constructor() {
    super();

    // ---- PARAMETERS ---- //
    // GRID
    this.grid = 0;
    this.gridShape = 3; // (this.shape)*2 + 1
    this.cellShape = 1;
    this.cellSpacing = 1.3;

    // DISPLAY
    this.updateRate = 16;

    // RENDERING
    this.renderer = new THREE.WebGLRenderer();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // COLORS
    this.lowColor = [79, 115, 54];
    this.highColor = [170, 58, 56];

    // OTHER
    this._frame = 0;
  }
  componentDidMount = () => {
    this.setupScene();
    this.animate();
    this.seed();

    setInterval(() => {
      this.step();
    }, this.updateRate);
  };

  animate = () => {
    requestAnimationFrame(this.animate);
    this.grid.rotation.x += 0.005;
    this.grid.rotation.y += 0.005;
    // this.grid.rotation.z += 0.005;
    this.renderer.render(this.scene, this.camera);
  };

  setupScene = () => {
    this.grid = this.createEmptyGrid({ state: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene.add(this.grid);
    this.camera.position.z = 20;

    // use ref as a mount point of the Three.js this.scene instead of the document.body
    this.mount.appendChild(this.renderer.domElement);
  };

  createEmptyGrid = options => {
    console.log("create_3D_Grid");
    const { state } = options;

    const new3DGrid = new THREE.Object3D(); // just to hold them all together
    const cubeCount = this.gridShape * 2 + 1;
    const cubeSize = this.cellShape;
    for (let x = 0; x < cubeCount; x += 1) {
      for (let y = 0; y < cubeCount; y += 1) {
        for (let z = 0; z < cubeCount; z += 1) {
          let cube = new THREE.Mesh(
            new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
            new THREE.MeshBasicMaterial({
              color: gradient(this.lowColor, this.highColor, 0),
              opacity: state ? 0.9 : 0.1,
              transparent: true
            })
          );
          cube.userData.state = state;

          cube.position.x = (x - (cubeCount - 1) / 2) * this.cellSpacing;
          cube.position.y = (y - (cubeCount - 1) / 2) * this.cellSpacing;
          cube.position.z = (z - (cubeCount - 1) / 2) * this.cellSpacing;

          cube.name = `${x}_${y}_${z}`;
          new3DGrid.add(cube);
        }
      }
    }

    return new3DGrid;
  };

  seed = odds => {
    let defaultOdds = 4;
    if (!odds || typeof odds !== "number") {
      odds = defaultOdds;
    }

    this.reset();

    this.grid.children.forEach(cube => {
      let selected = Math.floor(Math.random() * odds) === 1;
      if (selected) {
        cube.userData.state = true;
        cube.material.opacity = 1;
      } else {
        cube.userData.state = false;
        cube.material.opacity = 0.1;
      }
    });
  };

  step = () => {
    let nextCubeStates = {};

    // Get State
    this.grid.children.forEach(child => {
      // Get current state
      let currentCubeState = child.userData.state;

      let [x, y, z] = child.name.split("_").map(i => parseInt(i));

      let numberOfActiveNeighbors = countNeighbors(this.grid, x, y, z);
      let cubeState = currentCubeState
        ? numberOfActiveNeighbors >= 6 && numberOfActiveNeighbors <= 10
        : numberOfActiveNeighbors === 10 ||
          // numberOfActiveNeighbors === 8 ||
          //   numberOfActiveNeighbors === 6 ||
          //   numberOfActiveNeighbors === 5 ||
          numberOfActiveNeighbors === 4;
      nextCubeStates[child.name] = cubeState;
    });

    // Set State
    this.grid.children.forEach(child => {
      let newState = nextCubeStates[child.name];
      child.userData.state = newState ? true : false;
      child.material.opacity = newState ? 1.0 : 0.1;
      // Reset color
      child.material.color.set(
        gradient(
          this.lowColor,
          this.highColor,
          0 // reset
        )
      );
    });

    // Color code the "creatures"
    const uf = new unionFind(Math.pow(this.gridShape * 2 + 1, 3));
    const activeCubeCoordinates = getActiveCubeCoordinates(this.grid);

    // Get new color
    activeCubeCoordinates.forEach(([x, y, z]) => {
      const neighborCoordinates = getActiveNeighborCoordinates(
        this.grid,
        x,
        y,
        z
      );
      neighborCoordinates.forEach(coord => {
        let [n_x, n_y, n_z] = coord;
        const id = getID(this.gridShape, x, y, z);
        const n_id = getID(this.gridShape, n_x, n_y, n_z);
        uf.union(id, n_id);
      });
    });

    // Set new color
    activeCubeCoordinates.forEach(([x, y, z]) => {
      const cubeID = getID(this.gridShape, x, y, z);
      const cubeUFRoot = uf.root(cubeID);
      const sizePercent =
        (uf.segmentSize(cubeUFRoot) / Math.pow(this.gridShape * 2 + 1, 3)) * 3;
      const selectedColor = gradient(
        this.lowColor,
        this.highColor,
        sizePercent
      );

      let child = this.grid.children.find(child => {
        let [x, y, z] = child.name.split("_").map(i => parseInt(i));
        return cubeID === getID(this.gridShape, x, y, z);
      });
      if (!child) {
        console.log(`Issue with ${[x, y, z]}`);
        return;
      }
      child.material.opacity = 1;
      child.material.color.set(selectedColor);
    });
  };

  reset = () => {
    this.grid.children.forEach(cube => {
      cube.userData.state = false;
      cube.material.opacity = 0.1;
    });
  };

  render() {
    return <div ref={ref => (this.mount = ref)} />;
  }
}

function gradient(color1, color2, percent) {
  let result = "#";
  for (let i = 0; i < 3; i++) {
    let newValue = Math.floor(map(percent, 0, 1, color1[i], color2[i]));
    newValue = Math.min(255, Math.max(0, newValue));
    result += (newValue < 16 ? "0" : "") + newValue.toString(16);
  }
  return result;
}
function map(value, from_min, from_max, to_min, to_max) {
  return (
    ((value - from_min) * (to_max - to_min)) / (from_max - from_min) + to_min
  );
}

function getActiveNeighborCoordinates(grid, x, y, z) {
  let activeNeighborCoordinates = [];
  [-1, 0, 1].forEach(dx => {
    [-1, 0, 1].forEach(dy => {
      [-1, 0, 1].forEach(dz => {
        const n_x = x + dx; // Neighbor X
        const n_y = y + dy; // Neighbor Y
        const n_z = z + dz; // Neighbor Z
        if (dx === 0 && dy === 0 && dz === 0) {
          return;
        }
        let neighbor = grid.getObjectByName(`${n_x}_${n_y}_${n_z}`);
        if (neighbor === undefined) {
          return;
        }
        let neighborState = neighbor.userData.state;
        if (neighborState === true) {
          activeNeighborCoordinates.push([n_x, n_y, n_z]);
        }
      });
    });
  });
  return activeNeighborCoordinates;
}

function countNeighbors(grid, x, y, z) {
  if (!grid) {
    return;
  }
  return getActiveNeighborCoordinates(grid, x, y, z).length;
}

function getActiveCubeCoordinates(grid) {
  const activeCubeCoords = grid.children.map(child =>
    child.userData.state ? child.name.split("_").map(i => parseInt(i)) : false
  );

  const activeCoordsArray = activeCubeCoords.filter(
    cubeName => cubeName !== false
  );
  return activeCoordsArray;
}

function getID(gridShape, x, y, z) {
  let cubes = gridShape * 2 + 1;
  return x * cubes * cubes + y * cubes + z;
}
