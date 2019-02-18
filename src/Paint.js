import THREE from './Three';
import ReactDOM from 'react-dom';
let OrbitControls = require('three-orbit-controls')(THREE);

const DIRECTIONAL_LIGHT = 'directionalLight';

class Paint {
  constructor() {
    this.loader = new THREE.STLLoader();
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.reqNumber = 0;
  }

  init(context) {
    this.component = context;
    this.width = context.props.width;
    this.height = context.props.height;
    this.modelColor = context.props.modelColor;
    this.backgroundColor = context.props.backgroundColor;
    this.orbitControls = context.props.orbitControls;
    this.rotate = context.props.rotate;
    this.cameraX = context.props.cameraX;
    this.cameraY = context.props.cameraY;
    this.cameraZ = context.props.cameraZ;
    this.rotationSpeeds = context.props.rotationSpeeds;
    this.lights = context.props.lights;
    this.lightColor = context.props.lightColor;
    this.model = context.props.model;
    this.gridDimension = context.props.gridDimension;

    if (this.mesh !== undefined) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.scene.remove(this.grid);
    }
    const directionalLightObj = this.scene.getObjectByName(DIRECTIONAL_LIGHT);
    if (directionalLightObj) {
      this.scene.remove(directionalLightObj);
    }

    if (this.animationRequestId) {
      cancelAnimationFrame(this.animationRequestId);
    }

    //Detector.addGetWebGLMessage();
    this.distance = 10000;

    // lights processing
    const hasMultipleLights = this.lights.reduce(
      (acc, item) => acc && Array.isArray(item),
      true
    );
    if (hasMultipleLights) {
      this.lights.forEach(this.addLight.bind(this));
    } else {
      this.addLight(this.lights);
    }

    this.reqNumber += 1;
    return this.addSTLToScene(this.reqNumber);
  }

  addLight(lights, index = 0) {
    const directionalLight = new THREE.DirectionalLight(this.lightColor);
    directionalLight.position.set(...lights);
    directionalLight.name = DIRECTIONAL_LIGHT + index;
    directionalLight.position.normalize();
    this.scene.add(directionalLight);
  }

  loadSTLFromUrl(url, reqId) {
    return new Promise(resolve => {
      this.loader.crossOrigin = '';
      this.loader.loadFromUrl(url, geometry => {
        if (this.reqNumber !== reqId) {
          return;
        }
        resolve(geometry);
      });
    });
  }

  loadFromFile(file) {
    return new Promise(resolve => {
      this.loader.loadFromFile(file, geometry => {
        resolve(geometry);
      });
    });
  }

  addSTLToScene(reqId) {
    let loadPromise;
    if (typeof this.model === 'string') {
      loadPromise = this.loadSTLFromUrl(this.model, reqId);
    } else if (this.model instanceof ArrayBuffer) {
      loadPromise = this.loadFromFile(this.model);
    } else {
      return Promise.resolve(null);
    }
    return loadPromise.then(geometry => {
      // Calculate mesh noramls for MeshLambertMaterial.
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();

      // Center the object
      geometry.center();

      this.mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({
          overdraw: true,
          color: this.modelColor
        })
      );
      // Set the object's dimensions
      geometry.computeBoundingBox();
      this.xDims = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      this.yDims = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      this.zDims = geometry.boundingBox.max.z - geometry.boundingBox.min.z;

      if (this.rotate) {
        this.mesh.rotation.x = this.rotationSpeeds[0];
        this.mesh.rotation.y = this.rotationSpeeds[1];
        this.mesh.rotation.z = this.rotationSpeeds[2];
      }

      this.scene.add(this.mesh);

      this.addCamera();
      this.addInteractionControls();
      this.addToReactComponent();

      // Start the animation
      this.animate();
    });
  }

  addGrid() {
    const dimensions = this.getMeshDimensions();
    if (dimensions) {
      const divisions = this.gridDimension / 10;
      this.grid = new THREE.GridHelper(this.gridDimension, divisions);
      this.grid.position.y -= dimensions.height / 2;
      this.scene.add(this.grid);
    }
  }

  addCamera() {
    // Add the camera
    this.camera = new THREE.PerspectiveCamera(
      30,
      this.width / this.height,
      1,
      this.distance
    );

    if (this.cameraZ === null) {
      this.cameraZ = Math.max(this.xDims * 3, this.yDims * 3, this.zDims * 3);
    }

    this.camera.position.set(this.cameraX, this.cameraY, this.cameraZ);

    this.scene.add(this.camera);

    this.camera.lookAt(this.mesh);

    this.renderer.set;
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(this.backgroundColor, 1);
  }

  addInteractionControls() {
    // Add controls for mouse interaction
    if (this.orbitControls) {
      this.controls = new OrbitControls(
        this.camera,
        ReactDOM.findDOMNode(this.component)
      );
      this.controls.enableKeys = false;
      this.controls.addEventListener('change', this.orbitRender.bind(this));
    }
  }

  addToReactComponent() {
    // Add to the React Component
    ReactDOM.findDOMNode(this.component).replaceChild(
      this.renderer.domElement,
      ReactDOM.findDOMNode(this.component).firstChild
    );
  }

  /**
   * Animate the scene
   * @returns {void}
   */
  animate() {
    // note: three.js includes requestAnimationFrame shim
    if (this.rotate) {
      this.animationRequestId = requestAnimationFrame(this.animate.bind(this));
    } else {
      if (this.gridDimension) {
        this.addGrid();
      }
    }

    if (this.orbitControls) {
      this.controls.update();
    }
    this.render();
  }

  /**
   * Render the scene after turning off the rotation
   * @returns {void}
   */
  orbitRender() {
    if (this.rotate) {
      this.rotate = false;
    }

    this.render();
  }

  /**
   * Deallocate Mesh, renderer context.
   * @returns {void}
   */
  clean() {
    if (this.mesh !== undefined) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.scene.remove(this.mesh);
      delete this.mesh;
    }
    const directionalLightObj = this.scene.getObjectByName(DIRECTIONAL_LIGHT);
    if (directionalLightObj) {
      this.scene.remove(directionalLightObj);
    }

    if (this.animationRequestId) {
      cancelAnimationFrame(this.animationRequestId);
    }
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  /**
   * Render the scene
   * @returns {void}
   */
  render() {
    if (this.mesh && this.rotate) {
      this.mesh.rotation.x += this.rotationSpeeds[0];
      this.mesh.rotation.y += this.rotationSpeeds[1];
      this.mesh.rotation.z += this.rotationSpeeds[2];
    }
    this.renderer.render(this.scene, this.camera);
  }

  getMeshDimensions() {
    if (this.mesh) {
      const bbox = this.mesh.geometry.boundingBox;
      return {
        width: Math.round(bbox.max.x - bbox.min.x),
        height: Math.round(bbox.max.y - bbox.min.y),
        depth: Math.round(bbox.max.z - bbox.min.z)
      };
    }
  }
}

export default Paint;
