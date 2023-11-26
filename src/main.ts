import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';
import { getGridLineGroup, initGridLinesGUI } from './gridLines';


const gui = new dat.GUI();
// let isGridLinesPattern: boolean = false;
let isGridLineGui: boolean = false;
gui.add({ activateGridLines : false }, 'activateGridLines').onChange((value: boolean) => {
	// isGridLinesPattern = value;
	if (value) {
		if (!isGridLineGui) {
			isGridLineGui = initGridLinesGUI(gui);
		}
		else{
			const guiGridLineGroup = gui.folders.filter((folder: any) => folder._title === 'gridLines')[0];
			if (guiGridLineGroup){
				guiGridLineGroup.open()
			}
		}
		initgridLinePattern();
	} else {
		const gridLineGroup = scene.getObjectByName('gridLineGroup');
		if (gridLineGroup)
			scene.remove(gridLineGroup);
		
		const guiGridLineGroup = gui.folders.filter((folder: any) => folder._title === 'gridLines')[0];
		if (guiGridLineGroup){
			guiGridLineGroup.open(false)
		}
	}
})
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
// const newLineGroup = new THREE.Group();
// newLineGroup.name = 'newLineGroup';
// scene.add(newLineGroup);

const initScene = () => {

	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	camera.position.x = 100;
	camera.position.z = 500;
	camera.position.y = 100;

	const controller = new OrbitControls(camera, renderer.domElement);
	controller.target = new THREE.Vector3(100, 100, 0);
	controller.update();
}
function animate() {
	requestAnimationFrame(animate);

	renderer.render(scene, camera);
}
const initgridLinePattern = () => {
	const oldGridLineGroup = scene.getObjectByName('gridLineGroup');
	if (oldGridLineGroup)
		scene.remove(oldGridLineGroup);
	const gridLineGroup = getGridLineGroup();
	scene.add(gridLineGroup);
}
initScene();
// initgridLinePattern();

animate();