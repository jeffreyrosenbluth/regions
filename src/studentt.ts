export class StudentTDistribution {
  private degreesOfFreedom: number;

  constructor(degreesOfFreedom: number) {
    if (degreesOfFreedom <= 0) {
      throw new Error("Degrees of freedom must be positive");
    }
    this.degreesOfFreedom = degreesOfFreedom;
  }

  // Generate a sample from the standard normal distribution using Box-Muller transform
  private standardNormal(): number {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  // Generate a sample from chi-square distribution
  private chiSquare(degreesOfFreedom: number): number {
    let result = 0;
    for (let i = 0; i < degreesOfFreedom; i++) {
      const normal = this.standardNormal();
      result += normal * normal;
    }
    return result;
  }

  // Generate a sample from Student's t-distribution
  sample(): number {
    const normalSample = this.standardNormal();
    const chiSquareSample = this.chiSquare(this.degreesOfFreedom);
    return normalSample / Math.sqrt(chiSquareSample / this.degreesOfFreedom);
  }

  // Generate multiple samples
  sampleMany(count: number): number[] {
    return Array.from({ length: count }, () => this.sample());
  }
}

// Usage example
const tDist = new StudentTDistribution(5); // 5 degrees of freedom
console.log("Single sample:", tDist.sample());
console.log("Multiple samples:", tDist.sampleMany(5));

// Basic statistical analysis of samples
function analyzeDistribution(samples: number[]): void {
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const variance =
    samples.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    samples.length;
  const stdDev = Math.sqrt(variance);

  console.log(`Mean: ${mean}`);
  console.log(`Standard Deviation: ${stdDev}`);
}

const largeSample = tDist.sampleMany(10000);
analyzeDistribution(largeSample);
