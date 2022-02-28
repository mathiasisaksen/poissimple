/**
 * Naive Poisson disk sampling module
 * @module poissimple
 */

/**
 * Poissimple constructor.
 * @param {object} options Sampling options
 * @param {int} options.n The number of points to generate
 * @param {object} [options.dimensions] The dimensionality of the points, defaults to 2
 * @param {Array|Array[]} [options.extent] The extent of the space to sample from, must be either an array of two numbers (1D) or an array of arrays (>=2D), defaults to "volume" bounded between -1 and 1 along each axis
 * @param {int} [options.tries] The number of points generated before the algorithm gives up and uses the best candidate, defaults to 30
 * @param {boolean} [options.repulsiveBoundary] If true, the algorithm ensures that the sampled positions are at a distance from the boundary of the extent (half the distance used between positions), defaults to false
 * @param {function} [rng] The RNG function used when generating points, defaults to Math.random
 * @constructor
 */
function Poissimple(options, rng = Math.random) {
    this.n = options.n || 10;
    this.dim = options.dimensions || 2;

    if (this.dim === 1 && options.extent) {
        this.extent = [options.extent];
    } else {
        this.extent = options.extent || Array(this.dim).fill().map(() => [-1, 1]);
    }
    
    this.tries = options.tries || 30;
    this.rng = rng;
    this.repulsiveBoundary = options.repulsiveBoundary || false;

    this._computeExtentVolume();
    this._computeLowerDistance();
    this.points = [];
}

/**
 * Computes the minimum allowed distance between generated points.
 */
Poissimple.prototype._computeLowerDistance = function() {
    // This heuristic works well for dimensions 1, 2, and 3, no guarantees above that
    this.radius = Math.PI / 4 * Math.pow(this.volume / this.n, 1 / this.dim);
}

/**
 * Computes the "volume" (length for 1D, area for 2D, volume for >= 3D) of the extent.
 */
Poissimple.prototype._computeExtentVolume = function() {
    let volume = 1;
    this.extent.forEach(bounds => {
        const [lower, upper] = bounds;
        volume *= (upper - lower);
    });
    this.volume = volume;
}

/**
 * Generates a uniformly sampled position from the extent.
 * @returns {Array} The generated point, represented as an array with length equal to the number of dimensions
 */
Poissimple.prototype._sampleUniform = function() {
    return this.extent.map(bounds => bounds[0] + (bounds[1] - bounds[0])*this.rng());
}

/**
 * Computes the distance between two points.
 * @param {Array} point1 The first point
 * @param {Array} point2 The second point
 * @returns {float} The distance between the two points
 */
Poissimple.prototype._distance = function(point1, point2) {
    const diffArray = Array(this.dim).fill().map((_, i) => point2[i] - point1[i]);
    return Math.hypot(...diffArray);
}

/**
 * Computes the distance between a candidate position and the existing positions. If there are no existing positions, Infinity is returned.
 * @param {Array} candidate The candidate point
 * @returns {float} The distance between candidate and the nearest existing point
 */
Poissimple.prototype._distanceToExisting = function(candidate) {
    let minDistance = Infinity;
    this.points.forEach(p => {
        const currentDistance = this._distance(p, candidate);
        minDistance = Math.min(minDistance, currentDistance);
    });
    return minDistance;
}

/**
 * Computes the distance between a candidate position and the boundary of the extent.
 * @param {Array} candidate 
 * @returns The distance to the boundary
 */
Poissimple.prototype._distanceToBoundary = function(candidate) {
    let minDistance = Infinity;
    candidate.forEach((coordinate, i) => {
        const [lower, upper] = this.extent[i];
        minDistance = Math.min(minDistance, Math.abs(coordinate - lower), Math.abs(upper - coordinate));
    });
    return minDistance;
}

/**
 * Generates and returns the next point. If n points have already been generated, the returned value is null.
 * @returns {Array|null} The generated position
 */
Poissimple.prototype.next = function() {
    if (this.points.length === this.n) return null;

    let numTries = 0;
    let bestPoint = null;
    let largestDist = -Infinity;

    // Try a set number of times. If a point sufficiently far away from existing
    // points is found, break and add it to the point array. Otherwise, add the point
    // that is farthest away.
    while (numTries < this.tries) {
        const candidate = this._sampleUniform();
        let distToNearest = this._distanceToExisting(candidate);

        if (this.repulsiveBoundary) {
            // Multiply by 2 because distance to boundary must be larger than this.radius / 2
            distToNearest = Math.min(distToNearest, 2*this._distanceToBoundary(candidate));
        }

        if (distToNearest > largestDist) {
            bestPoint = candidate;
            largestDist = distToNearest;
        }
        if (distToNearest > this.radius) break;
        numTries++;
    }
    this.points.push(bestPoint);
    return bestPoint;
}

/**
 * Generates and returns the n points.
 * @returns {Array|Array[]} Array containing the generated points
 */
Poissimple.prototype.fill = function() {
    while (this.points.length < this.n) {
        this.next();
    }
    return this.points;
}

/**
 * Returns the points generated so far.
 * @returns {Array|Array[]}
 */
Poissimple.prototype.getPoints = function() {
    return this.points;
}

module.exports = Poissimple;