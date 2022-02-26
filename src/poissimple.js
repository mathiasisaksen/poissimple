// A simple and slow implementation of Poisson disk sampling
function PoisSimple({ n, dimensions, extent, tries }, rng = Math.random) {
    this.n = n;
    this.dim = dimensions;
    this.extent = extent || Array(dimensions).fill().map(() => [-1, 1]);
    this.tries = tries || 30;
    this.rng = rng;

    this._computeExtentVolume();
    this._computeLowerDistance();
    this.points = [];
}

PoisSimple.prototype._computeLowerDistance = function() {
    // This heuristic works reasonably well for 
    this.radius = Math.PI / 4 * Math.pow(this.volume / this.n, 1 / this.dim);
}

PoisSimple.prototype._computeExtentVolume = function() {
    let volume = 1;
    this.extent.forEach(bounds => {
        const [lower, upper] = bounds;
        volume *= (upper - lower);
    });
    this.volume = volume;
}

PoisSimple.prototype._sampleUniform = function() {
    return this.extent.map(bounds => bounds[0] + (bounds[1] - bounds[0])*this.rng());
}

PoisSimple.prototype._distance = function(p1, p2) {
    const diffArray = Array(this.dim).fill().map((_, i) => p2[i] - p1[i]);
    return Math.hypot(...diffArray);
}

PoisSimple.prototype._distanceToExisting = function(candidate) {
    let minDistance = Infinity;
    this.points.forEach(p => {
        const currentDistance = this._distance(p, candidate);
        minDistance = Math.min(minDistance, currentDistance);
    });
    return minDistance;
}

PoisSimple.prototype.next = function() {
    if (this.points.length === this.n) return null;

    let numTries = 0;
    let bestPoint = null;
    let largestDist = -Infinity;

    // Try a set number of times. If a point sufficiently far away from existing
    // points is found, break and add it to the point array. Otherwise, add the point
    // that is the farthest away from the existing.
    while (numTries < this.tries) {
        const candidate = this._sampleUniform();
        const distToNearest = this._distanceToExisting(candidate);

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

PoisSimple.prototype.fill = function() {
    while (this.points.length < this.n) {
        this.next();
    }
    return this.points;
}

PoisSimple.prototype.getAllPoints = function() {
    return this.points;
}

export default PoisSimple;