// Copied and modified from https://github.com/AdeonMaster/canvas-arbitrary-quads

const TESSELATION = 10; // controls transformation quality (higher is better) - range(1, 10)
const SEAM_OVERLAP = 0.1; // hides the seam artifacts - range(0.0, 0.1)

const FILL_METHOD = {
  BILINEAR: 'bilinear',
  PERSPECTIVE: 'perspective',
};



// See figure: https://github.com/bschwind/Face-Squash
const lerpQuad = quad => {
  const p01 = d3.interpolate(quad[0], quad[1]);
  const p32 = d3.interpolate(quad[3], quad[2]);

  return (s, t) => d3.interpolate(p01(s), p32(s))(t);
};

// return the triangles to fill the cell at the given row/column
const rowColTris = (row, col, { lerp, projection }, tiles) => {
  const pad = SEAM_OVERLAP; // we add padding to remove tile seams
  let p;

  if (lerp) {
    p = (r, c) => lerp(c / tiles, r / tiles);
  }

  if (projection) {
    p = (r, c) => projectPoint({ x: c / tiles, y: r / tiles }, projection);
  }

  return [
    /*
    0-----1
     \    |
       \  |  top
         \|
          2
    */
    [
      p(row - pad, col - pad * 2), // extra diagonal padding
      p(row - pad, col + 1 + pad),
      p(row + 1 + pad * 2, col + 1 + pad), // extra diagonal padding
    ],
    /*
    2
    |\
    |  \   bottom
    |    \
    1-----0
    */
    [
      p(row + 1 + pad, col + 1 + pad),
      p(row + 1 + pad, col - pad),
      p(row - pad, col - pad),
    ],
  ];
};

const fillQuadTex = (ctx, src, dst, opts = {}) => {
  const tiles = opts.tiles || 10;
  const method = opts.method || FILL_METHOD.BILINEAR; // or perspective

  const lerpSrc = lerpQuad(src);
  const lerpDst = lerpQuad(dst);

  const projectionSrc = forwardProjectionMatrixForPoints(src);
  const projectionDst = forwardProjectionMatrixForPoints(dst);

  // clip to erase the external padding
  ctx.save();
  ctx.beginPath();
  for (let i = 0, len = dst.length; i < len; ++i) {
    ctx.lineTo(dst[i].x, dst[i].y);
  }
  ctx.closePath();
  ctx.clip();

  // draw triangles
  for (let r = 0; r < tiles; ++r) {
    for (let c = 0; c < tiles; ++c) {
      let srcTop;
      let srcBot;
      let dstTop;
      let dstBot;

      switch (method) {
        case FILL_METHOD.BILINEAR: {
          [srcTop, srcBot] = rowColTris(r, c, { lerp: lerpSrc }, tiles);
          [dstTop, dstBot] = rowColTris(r, c, { lerp: lerpDst }, tiles);
          break;
        }

        case FILL_METHOD.PERSPECTIVE: {
          [srcTop, srcBot] = rowColTris(r, c, { projection: projectionSrc }, tiles);
          [dstTop, dstBot] = rowColTris(r, c, { projection: projectionDst }, tiles);
          break;
        }

        default:
          throw new Error(`Unknown fill method ${method}`);
      }

      fillTriTex(ctx, srcTop, dstTop);
      fillTriTex(ctx, srcBot, dstBot);
    }
  }

  ctx.restore();
};


/*
  from: https://github.com/mrdoob/three.js/blob/r91/examples/js/renderers/CanvasRenderer.js#L917
  math: http://extremelysatisfactorytotalitarianism.com/blog/?p=2120
*/

/* eslint no-param-reassign:0 */

const fillTexPath = (ctx, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2) => {
  x1 -= x0; y1 -= y0;
  x2 -= x0; y2 -= y0;

  u1 -= u0; v1 -= v0;
  u2 -= u0; v2 -= v0;

  const det = u1 * v2 - u2 * v1;

  if (det === 0) return;

  const idet = 1 / det;

  const m11 = (v2 * x1 - v1 * x2) * idet;
  const m12 = (v2 * y1 - v1 * y2) * idet;
  const m21 = (u1 * x2 - u2 * x1) * idet;
  const m22 = (u1 * y2 - u2 * y1) * idet;
  const dx = x0 - m11 * u0 - m21 * v0;
  const dy = y0 - m12 * u0 - m22 * v0;

  ctx.save();
  ctx.transform(m11, m12, m21, m22, dx, dy);
  ctx.fill();
  ctx.restore();
};


const fillTriTex = (ctx, src, dst) => {
  ctx.beginPath();
  for (let i = 0, len = dst.length; i < len; ++i) {
    ctx.lineTo(dst[i].x, dst[i].y);
  }
  ctx.closePath();

  const [
    [x0, y0],
    [x1, y1],
    [x2, y2],
  ] = dst.map(({ x, y }) => [x, y]);

  const [
    [u0, v0],
    [u1, v1],
    [u2, v2],
  ] = src.map(({ x, y }) => [x, y]);

  fillTexPath(ctx, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2);
};


// import Matrix from 'node-matrices';

const forwardProjectionMatrixForPoints = points => {
  const deltaX1 = points[1].x - points[2].x;
  const deltaX2 = points[3].x - points[2].x;
  const sumX = points[0].x - points[1].x + points[2].x - points[3].x;
  const deltaY1 = points[1].y - points[2].y;
  const deltaY2 = points[3].y - points[2].y;
  const sumY = points[0].y - points[1].y + points[2].y - points[3].y;
  const denominator = new Matrix([deltaX1, deltaX2], [deltaY1, deltaY2]).determinant();
  const g = new Matrix([sumX, deltaX2], [sumY, deltaY2]).determinant() / denominator;
  const h = new Matrix([deltaX1, sumX], [deltaY1, sumY]).determinant() / denominator;
  const a = points[1].x - points[0].x + g * points[1].x;
  const b = points[3].x - points[0].x + h * points[3].x;
  const c = points[0].x;
  const d = points[1].y - points[0].y + g * points[1].y;
  const e = points[3].y - points[0].y + h * points[3].y;
  const f = points[0].y;

  return new Matrix(
    [a, b, c],
    [d, e, f],
    [g, h, 1],
  );
};


/*
  Original author: Shaun Lebron
  Original article: https://observablehq.com/@shaunlebron/texture-drawing-for-html-canvas
  Description: This package is Shaun Lebron's article adaptation for NPM
*/

const drawArbitraryQuadImage = (ctx, texture, src, dst, method = FILL_METHOD.BILINEAR) => {
  const pattern = ctx.createPattern(texture, 'no-repeat');

  ctx.fillStyle = pattern;

  fillQuadTex(ctx, src, dst, {
    tiles: TESSELATION,
    method,
  });
};


const projectPoint = (point, projectionMatrix) => {
  const pointMatrix = projectionMatrix.multiply(new Matrix([point.x], [point.y], [1]));

  return {
    x: pointMatrix.get(0, 0) / pointMatrix.get(2, 0),
    y: pointMatrix.get(1, 0) / pointMatrix.get(2, 0),
  };
};
