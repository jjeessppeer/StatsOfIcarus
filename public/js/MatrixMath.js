export function transformPoint(matrix, x, y) {
    return [matrix.a * x + matrix.c * y + matrix.e, matrix.b * x + matrix.d * y + matrix.f];
}

export function getXScale(matrix) {
    return matrix.a;
}

export function scaleMatrix(matrix, scale) {
    matrix[0] *= scale;
    matrix[4] *= scale;
    return matrix;
}

export function translateMatrix(matrix, x, y) {
    matrix[2] += x * matrix[0];
    matrix[5] += y * matrix[4];
}

export function getInvertedMatrix(m) {
    let m2 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    m2[0] = m[4] * m[8] - m[5] * m[7];
    m2[1] = -(m[1] * m[8] - m[2] * m[7]);
    m2[2] = m[1] * m[5] - m[2] * m[4];
    m2[3] = -(m[3] * m[8] - m[5] * m[6]);
    m2[4] = m[0] * m[8] - m[2] * m[6];
    m2[5] = -(m[0] * m[5] - m[2] * m[3]);
    m2[6] = m[3] * m[7] - m[4] * m[6];
    m2[7] = -(m[0] * m[7] - m[1] * m[6]);
    m2[8] = m[0] * m[4] - m[1] * m[3];

    let det = m[0] * m2[0] + m[1] * m2[3] + m[2] * m[6];
    m2 = m2.map(x => x / det);

    return m2;
}

export function resetMatrix(matrix) {
    matrix[0] = 1;
    matrix[1] = 0;
    matrix[2] = 0;

    matrix[3] = 0;
    matrix[4] = 1;
    matrix[5] = 0;

    matrix[6] = 0;
    matrix[7] = 0;
    matrix[8] = 1;
}

export function applyMatrix(ctx, matrix) {
    ctx.setTransform(matrix[0], matrix[3], matrix[1], matrix[4], matrix[2], matrix[5]);
}

export function transformPointMatrix(x, y, matrix) {
    return [matrix[0] * x + matrix[1] * y + matrix[2], matrix[3] * x + matrix[4] * y + matrix[5]];
}

export function zoomMatrixAround(matrix, x, y, zoom) {
    [x, y] = transformPointMatrix(x, y, getInvertedMatrix(matrix));
    translateMatrix(matrix, x, y);
    scaleMatrix(matrix, zoom);
    translateMatrix(matrix, -x, -y);
}