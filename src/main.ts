import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });


const lineMat = new THREE.LineBasicMaterial({
	color: 0xff0000
});

const newLineGroup = new THREE.Group();
newLineGroup.name = 'newLineGroup';
scene.add(newLineGroup);

const countX = 200;
const countY = 200;
const pointAmount = 5;
let _horizontalLines:THREE.Line[]
let _verticalLines:THREE.Line[]
let _atractorPoints: THREE.Vector2[] = [];

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
const initPattern = () => {
	const horizontalLines:THREE.Line[] = createHorizontalLines(countY);
	_horizontalLines = horizontalLines;
	const verticalLines = createVerticalLines(countX);
	_verticalLines = verticalLines;
	const atractorPoints = createAtractorpoints(pointAmount);
	_atractorPoints = atractorPoints;
	horizontalLines.forEach((line: THREE.Line) => {
		newLineGroup.add(line);
	})
	verticalLines.forEach((line: THREE.Line) => {
		newLineGroup.add(line);
	})
	updatePattern(horizontalLines, verticalLines, atractorPoints);
}

const updatePattern = (horizontalLines: THREE.Line[], verticalLines: THREE.Line[], atractorPoints: THREE.Vector2[]) => {
	atractorPoints.forEach((atractorPoint: THREE.Vector2) => {
		horizontalLines.forEach((line: THREE.Object3D) => {
			const lineGeo = (line as THREE.Line).geometry as THREE.BufferGeometry;
			const linePoints = lineGeo.attributes.position.array as Float64Array;
			let newPoints = getAttractedLinePoints(linePoints, atractorPoint, 'horizontal');
			// lineGeo.dispose();
			lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPoints, 3));
		})
		verticalLines.forEach((line: THREE.Object3D) => {
			const lineGeo = (line as THREE.Line).geometry as THREE.BufferGeometry;
			const linePoints = lineGeo.attributes.position.array as Float64Array;
			let newPoints = getAttractedLinePoints(linePoints, atractorPoint, 'vertical');
			// lineGeo.dispose();
			lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPoints, 3));
		})
	});
}
const createHorizontalLines = (amount: number): THREE.Line[] => {
	const lines: THREE.Line[] = [];
	for (let i = 0; i < amount; i++) {
		const curve = new THREE.LineCurve(
			new THREE.Vector2(0, i),
			new THREE.Vector2(amount, i)
		);
		const points = curve.getPoints(pointAmount);
		const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
		const line = new THREE.Line(lineGeo, lineMat);
		lines.push(line);
	}
	return lines;
}
const createVerticalLines = (amount: number): THREE.Line[] => {
	const lines: THREE.Line[] = [];
	for (let i = 0; i < amount; i++) {
		const curve = new THREE.LineCurve(
			new THREE.Vector2(i, 0),
			new THREE.Vector2(i, amount)
		);
		const points = curve.getPoints(pointAmount);
		const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
		const line = new THREE.Line(lineGeo, lineMat);
		lines.push(line);
	}
	return lines;
}

const createAtractorpoints = (amount: number) => {

	const atractorPoints: THREE.Vector2[] = [];
	for (let i = 0; i < amount; i++) {
		const x = Math.random() * countX;
		const y = Math.random() * countY;
		atractorPoints.push(new THREE.Vector2(x, y));
	}
	return atractorPoints;
}


const getAttractedLinePoints = (linePoints: Float64Array, atractorPoint: THREE.Vector2, type: string) => {
	let newPoints: Float64Array = new Float64Array(linePoints.length)
	for (let i = 0; i < linePoints.length; i += 3) {
		const x = linePoints[i];
		const y = linePoints[i + 1];

		const deltaX = atractorPoint.x - x;
		const deltaY = atractorPoint.y - y;

		const percentageX = (100 - Math.abs((deltaX / (countX / 2) * 100))) / 100;

		const distance = Math.abs(deltaY); // Calculate the distance
		const maxDistance = countY; // Define the maximum distance
		const percentageY = customFalloff(distance, maxDistance, 0.01, 4)
		if (type === 'horizontal') {
			const percentageX = (100 - Math.abs((deltaX / (countX / 2) * 100))) / 100;

			const distance = Math.abs(deltaY); // Calculate the distance
			const maxDistance = countY; // Define the maximum distance
			const percentageY = customFalloff(distance, maxDistance, .01, 4)
			newPoints[i] = x;
			newPoints[i + 1] = y + (deltaY * percentageX * percentageY);
			newPoints[i + 2] = 0;
		}
		else if (type === 'vertical') {
			const percentageY = (100 - Math.abs((deltaY / (countX / 2) * 100))) / 100;

			const distance = Math.abs(deltaX); // Calculate the distance
			const maxDistance = countY; // Define the maximum distance
			const percentageX = customFalloff(distance, maxDistance, .01, 4)
			newPoints[i] = x + (deltaX * percentageX * percentageY);
			newPoints[i + 1] = y;
			newPoints[i + 2] = 0;
		}
		// newPoints.push(new THREE.Vector2(x, y + (deltaY * percentageX * percentageY)));
	}
	return newPoints;
}

function customFalloff(distance: number, maxDistance: number, exponentialFactor: number, linearFactor: number) {

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

initScene();
initPattern();
animate();