import * as THREE from 'three';
import * as dat from 'lil-gui';

export function initGridLinesGUI(gui: dat.GUI) {
    const guiGroup = gui.addFolder('gridLines');
    // Other code to set up the GUI for grid lines
    guiGroup.add({ lineCount }, 'lineCount', 2, 1000).step(1).onChange((value: number) => {
        const proportion = value / lineCount;
        lineCount = value;
        _atractorPoints.forEach((point: THREE.Vector2) => {
            point.x = point.x * proportion;
            point.y = point.y * proportion;
        })
        resetgridLines();
        initgridLines();
    })
    guiGroup.add({ pointAmount }, 'pointAmount', 1, 200).step(1).onChange((value: number) => {
        pointAmount = value;
        _atractorPoints = [];
        resetgridLines();
        initgridLines();
    })
    const guiPoints = guiGroup.addFolder('points').open(false);
    guiPoints.add({ atractorPointsJson }, 'atractorPointsJson').onFinishChange((value: string) => {
        if (value === '') {
            return;
        }
        atractorPointsJson = value;
        try {
            _atractorPoints = JSON.parse(atractorPointsJson);
        }
        catch (e) {
            console.log(e);
            return;
        }
        resetgridLines();
        initgridLines();
    })
        guiGroup.add({ horizontal: true }, 'horizontal').onChange((value: boolean) => {
        isHorizontalLines = value;
        if (!value) {
            _horizontalLines.forEach((line: THREE.Line) => {
                line.geometry.dispose();
                horizontalLineGroup.remove(line);
            })
            _horizontalLines = [];
        }
        else {
            initgridLines();
        }
    })
    guiGroup.add({ vertical: true }, 'vertical').onChange((value: boolean) => {
        isVerticalLines = value;
        if (!value) {
            _verticalLines.forEach((line: THREE.Line) => {
                line.geometry.dispose();
                verticalLineGroup.remove(line);
            })
            _verticalLines = [];
        }
        else {
            initgridLines();
        }
    })
    let expFalloffGui = guiGroup.add({ exponentialFalloff }, 'exponentialFalloff', 0, 0.3).listen().onChange((value: number) => {
        exponentialFalloff = value;
        if (isProportional) {
            linearFalloff = exponentialFalloff / proportion;
            linFalloffGui.object = { linearFalloff };
        }
        resetgridLines();
        initgridLines();
    })
    let linFalloffGui = guiGroup.add({ linearFalloff }, 'linearFalloff', 0, 100).listen().onChange((value: number) => {
        linearFalloff = value;
        if (isProportional) {
            exponentialFalloff = linearFalloff * proportion;
            expFalloffGui.object = { exponentialFalloff };
        }
        resetgridLines();
        initgridLines();
    })
    guiGroup.add({ isProportional }, 'isProportional').onChange((value: boolean) => {
        isProportional = value;
        if (isProportional) {
            proportion = exponentialFalloff / linearFalloff;
        }
    });
    guiGroup.add({ exportLinesAsSVG }, 'exportLinesAsSVG');

    guiGroup.add({ refresh }, 'refresh');
    return true
}

let isProportional = true;

let proportion = 0.01 / 4;
let exponentialFalloff = 0.01;
let linearFalloff = 4;

let lineCount = 200;
let isHorizontalLines = true;
let isVerticalLines = true;
let gridLineGroup = new THREE.Group();
gridLineGroup.name = 'gridLineGroup';
const verticalLineGroup = new THREE.Group();
verticalLineGroup.name = 'verticalLineGroup';
gridLineGroup.add(verticalLineGroup);
const horizontalLineGroup = new THREE.Group();
horizontalLineGroup.name = 'horizontalLineGroup';
gridLineGroup.add(horizontalLineGroup);

let pointAmount = 5;


let _horizontalLines: THREE.Line[] = [];


let _verticalLines: THREE.Line[] = [];


let _atractorPoints: THREE.Vector2[] = [];
let atractorPointsJson = '';


export const getGridLineGroup = () => {
    initgridLines();
    return gridLineGroup;
}
const refresh = () => {
    _atractorPoints = [];
    resetgridLines();
    initgridLines();
}
const initgridLines = () => {
    if (_horizontalLines.length === 0 && isHorizontalLines) {
        _horizontalLines = createHorizontalLines(lineCount);
        horizontalLineGroup.add(..._horizontalLines);
    }
    if (_verticalLines.length === 0 && isVerticalLines) {
        _verticalLines = createVerticalLines(lineCount);
        verticalLineGroup.add(..._verticalLines);
    }
    let atractorPoints: THREE.Vector2[] = [];
    if (_atractorPoints.length === 0) {
        atractorPoints = createAttractorpoints(pointAmount);
        _atractorPoints = atractorPoints;
        atractorPointsJson = JSON.stringify(atractorPoints);
    }
    else {
        atractorPoints = _atractorPoints;
    }
    updategridLines(_horizontalLines, _verticalLines, atractorPoints);
}
const resetgridLines = () => {
    _horizontalLines.forEach((line: THREE.Line) => {
        line.geometry.dispose();
        horizontalLineGroup.remove(line);
    })
    _horizontalLines = [];
    _verticalLines.forEach((line: THREE.Line) => {
        line.geometry.dispose();
        verticalLineGroup.remove(line);
    })
    _verticalLines = [];
    // gridLineGroup.children.forEach((group: THREE.Object3D) => {
    //     gridLineGroup.remove(group);
    // })
}

const updategridLines = (horizontalLines: THREE.Line[], verticalLines: THREE.Line[], atractorPoints: THREE.Vector2[]) => {
    atractorPoints.forEach((atractorPoint: THREE.Vector2) => {
        horizontalLines.forEach((line: THREE.Object3D) => {
            const lineGeo = (line as THREE.Line).geometry as THREE.BufferGeometry;
            const linePoints = lineGeo.attributes.position.array as Float64Array;
            let newPoints = getAttractedLinePoints(linePoints, atractorPoint, 'horizontal', exponentialFalloff, linearFalloff);
            // lineGeo.dispose();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPoints, 3));
        })
        verticalLines.forEach((line: THREE.Object3D) => {
            const lineGeo = (line as THREE.Line).geometry as THREE.BufferGeometry;
            const linePoints = lineGeo.attributes.position.array as Float64Array;
            let newPoints = getAttractedLinePoints(linePoints, atractorPoint, 'vertical', exponentialFalloff, linearFalloff);
            // lineGeo.dispose();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPoints, 3));
        })
    });
}


const lineMat = new THREE.LineBasicMaterial({
    color: 0xff0000
});
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

const createAttractorpoints = (amount: number) => {

    const atractorPoints: THREE.Vector2[] = [];
    for (let i = 0; i < amount; i++) {
        const x = Math.random() * lineCount;
        const y = Math.random() * lineCount;
        atractorPoints.push(new THREE.Vector2(x, y));
    }
    return atractorPoints;
}


const getAttractedLinePoints = (linePoints: Float64Array, atractorPoint: THREE.Vector2, type: string, exponentialFalloff: number, linearFalloff: number) => {
    let newPoints: Float64Array = new Float64Array(linePoints.length)
    for (let i = 0; i < linePoints.length; i += 3) {
        const x = linePoints[i];
        const y = linePoints[i + 1];

        const deltaX = atractorPoint.x - x;
        const deltaY = atractorPoint.y - y;

        // const percentageX = (100 - Math.abs((deltaX / (countX / 2) * 100))) / 100;

        // const distance = Math.abs(deltaY); // Calculate the distance
        // const maxDistance = countY; // Define the maximum distance
        // const percentageY = customFalloff(distance, maxDistance, 0.01, 4)

        if (type === 'horizontal') {
            const percentageX = (100 - Math.abs((deltaX / (lineCount / 2) * 100))) / 100;

            const distance = Math.abs(deltaY); // Calculate the distance
            const maxDistance = lineCount; // Define the maximum distance
            const percentageY = customFalloff(distance, maxDistance, exponentialFalloff, linearFalloff)
            newPoints[i] = x;
            newPoints[i + 1] = y + (deltaY * percentageX * percentageY);
            newPoints[i + 2] = 0;
        }
        else if (type === 'vertical') {
            const percentageY = (100 - Math.abs((deltaY / (lineCount / 2) * 100))) / 100;

            const distance = Math.abs(deltaX); // Calculate the distance
            const maxDistance = lineCount; // Define the maximum distance
            const percentageX = customFalloff(distance, maxDistance, exponentialFalloff, linearFalloff)
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
function getBoundsXY(lines: THREE.Line[]): { boundsX: number, boundsY: number, minx: number, miny: number, maxx: number, maxy: number } {
    let maxx = 0;
    let minx = 0;
    let maxy = 0;
    let miny = 0;
    lines.forEach((line: THREE.Line) => {
        const lineGeo = line.geometry as THREE.BufferGeometry;
        const linePoints = lineGeo.attributes.position.array as Float64Array;
        for (let i = 0; i < linePoints.length; i += 3) {
            const x = linePoints[i];
            const y = linePoints[i + 1];
            if (x > maxx) {
                maxx = x;
            }
            if (y > maxy) {
                maxy = y;
            }
            if (x < minx) {
                minx = x;
            }
            if (y < miny) {
                miny = y;
            }
        }
    })
    const boundsX = Math.abs(maxx) + Math.abs(minx);
    const boundsY = Math.abs(maxy) + Math.abs(miny);
    return { boundsX, boundsY, minx, miny, maxx, maxy };
}
const exportLinesAsSVG = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('viewBox', '0 0 1000 1000');

    const multiplyer = 1;
    //find highest and lowest x and y value
    // const _horizontalLines = scene.getObjectByName('gridLineGroup')?.getObjectByName('horizontalLineGroup')?.children as THREE.Line[];
    // const _verticalLines = scene.getObjectByName('gridLineGroup')?.getObjectByName('verticalLineGroup')?.children as THREE.Line[];


    let { boundsX, boundsY } = getBoundsXY([..._horizontalLines, ..._verticalLines]);
    const { minx, miny, maxx, maxy } = getBoundsXY([..._horizontalLines, ..._verticalLines]);


    // Calculate the width and height of your content
    const contentWidth = maxx - minx;
    const contentHeight = maxy - miny;

    // Calculate the center point of your content
    const centerX = (minx + maxx) / 2;
    const centerY = (miny + maxy) / 2;
    const margin = 100;
    // Determine the desired size of the viewBox with some margin
    const viewBoxWidth = contentWidth + margin;
    const viewBoxHeight = contentHeight + margin;

    // Calculate the top-left corner of the viewBox
    const viewBoxMinX = centerX - viewBoxWidth / 2;
    const viewBoxMinY = centerY - viewBoxHeight / 2;

    // Set the viewBox attribute of your SVG element
    svg.setAttribute('viewBox', `${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`);
    console.log(boundsX, boundsY);
    svg.setAttribute('width', `${boundsX}`);
    svg.setAttribute('height', `${boundsY}`);
    _horizontalLines.forEach((line: THREE.Line) => {
        if (!line.visible) {
            return;
        }
        const lineGeo = line.geometry as THREE.BufferGeometry;
        const linePoints = lineGeo.attributes.position.array as Float64Array;
        const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        let pointsString = '';
        for (let i = 0; i < linePoints.length; i += 3) {
            const x = linePoints[i];
            const y = linePoints[i + 1];
            pointsString += `${x * multiplyer},${y * multiplyer} `;
        }
        lineElement.setAttribute('points', pointsString);
        lineElement.setAttribute('stroke', 'black');
        lineElement.setAttribute('stroke-width', '1');
        lineElement.setAttribute('fill', 'none');

        svg.appendChild(lineElement);
    })
    _verticalLines.forEach((line: THREE.Line) => {
        if (!line.visible) {
            return;
        }
        const lineGeo = line.geometry as THREE.BufferGeometry;
        const linePoints = lineGeo.attributes.position.array as Float64Array;
        const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        let pointsString = '';
        for (let i = 0; i < linePoints.length; i += 3) {
            const x = linePoints[i];
            const y = linePoints[i + 1];
            pointsString += `${x * multiplyer},${y * multiplyer} `;
        }
        lineElement.setAttribute('points', pointsString);
        lineElement.setAttribute('stroke', 'black');
        lineElement.setAttribute('stroke-width', '1');
        lineElement.setAttribute('fill', 'none');
        svg.appendChild(lineElement);
    })
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'pattern.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

}

