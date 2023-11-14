import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
// scene.add(ambientLight);
const controller = new OrbitControls(camera, renderer.domElement);


const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
// scene.add( cube );

camera.position.z = 5;
//create a line geometry
const lineMat = new THREE.LineBasicMaterial({
	color: 0x0000ff,
	linewidth: 1,
});
const originalLineGroup = new THREE.Group();
originalLineGroup.name = 'originalLineGroup';
let lineArray: THREE.Line[] = [];
const newLineGroup = new THREE.Group();
newLineGroup.name = 'newLineGroup';
scene.add(newLineGroup);

const countX = 200;
const countY = 200;
for (let i = 0; i < countY; i++) {
	const curve = new THREE.LineCurve(
		new THREE.Vector2(0, i),
		new THREE.Vector2(countX, i)
	);

	const points = curve.getPoints(3);
	const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
	const line = new THREE.Line(lineGeo, lineMat);
	originalLineGroup.add(line);
	lineArray.push(line);
}
//get 3 random Vector2 within bounding box
const atractorPoints: THREE.Vector2[] = [];
for (let i = 0; i < 5; i++) {
	const x = Math.random() * countX;
	const y = Math.random() * countY;
	atractorPoints.push(new THREE.Vector2(x, y));
}

const createPattern = () => {
	atractorPoints.forEach((atractorPoint: THREE.Vector2) => {
		const newLineArray: THREE.Line[] = [];
		lineArray.forEach((line: THREE.Object3D) => {
			const lineGeo = (line as THREE.Line).geometry as THREE.BufferGeometry;
			const linePoints = lineGeo.attributes.position.array as Float64Array;
			let newPoints: THREE.Vector2[] = getAttractedLinePoints(linePoints, atractorPoint);

			const newLineGeo = new THREE.BufferGeometry().setFromPoints(newPoints);
			const newLineMat = new THREE.LineBasicMaterial({
				color: 0xff0000,
				linewidth: 1,
			});
			const line1 = new THREE.Line(newLineGeo, newLineMat);
			newLineArray.push(line1);
		})
		lineArray = newLineArray;
	});
	lineArray.forEach((line: THREE.Line) => {
		newLineGroup.add(line);
	})
}

const getAttractedLinePoints = (linePoints: Float64Array, atractorPoint: THREE.Vector2) => {
	let newPoints: THREE.Vector2[] = [];
	for (let i = 0; i < linePoints.length; i += 3) {
		const x = linePoints[i];
		const y = linePoints[i + 1];

		const deltaX = atractorPoint.x - x;
		const deltaY = atractorPoint.y - y;

		const percentageX = (100 - Math.abs((deltaX / (countX / 2) * 100))) / 100;

		const distance = Math.abs(deltaY); // Calculate the distance
		const maxDistance = countY; // Define the maximum distance
		const percentageY = customFalloff(distance, maxDistance);
		newPoints.push(new THREE.Vector2(x, y + (deltaY * percentageX * percentageY)));
	}
	return newPoints;
}


createPattern();
function customFalloff(distance: number, maxDistance: number) {
	const exponentialFactor = 0.1; // Adjust this for exponential falloff
	const linearFactor = 0.2; // Adjust this for linear falloff

	// Calculate the exponential component
	const exponentialPart = Math.exp(-exponentialFactor * distance);

	// Calculate the linear component
	const linearPart = 1 - (distance / maxDistance) * linearFactor;

	// Combine both components
	return exponentialPart * linearPart;
}
function animate() {
	requestAnimationFrame(animate);


	renderer.render(scene, camera);
}

animate();