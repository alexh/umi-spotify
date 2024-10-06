class Analyzer {
  constructor() {
    this.analyser = null;
    this.dataArray = null;
    this.isInitialized = false;
    this.animationFrame = null;
    this.lastAnalysisTime = 0;
    this.analysisInterval = 100; // Analyze every 100ms
  }

  initialize(audioContext, source) {
    if (!audioContext || !source) {
      console.error('AudioContext and source are required to initialize the Analyzer');
      return;
    }

    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);

    source.connect(this.analyser);

    this.isInitialized = true;
    console.log('Audio analyzer initialized', { 
      fftSize: this.analyser.fftSize, 
      bufferLength: bufferLength,
      minDecibels: this.analyser.minDecibels,
      maxDecibels: this.analyser.maxDecibels,
      smoothingTimeConstant: this.analyser.smoothingTimeConstant
    });
  }

  start(callback) {
    if (!this.isInitialized) {
      console.error('Analyzer not initialized. Call initialize() first.');
      return;
    }

    const analyze = () => {
      const now = performance.now();
      if (now - this.lastAnalysisTime >= this.analysisInterval) {
        this.analyser.getByteFrequencyData(this.dataArray);
        
        const data = {
          frequencyData: Array.from(this.dataArray),
          averageFrequency: this.getAverageFrequency(),
          bassFrequency: this.getBassFrequency(),
          trebleFrequency: this.getTrebleFrequency()
        };

        callback(data);  // Call the callback function with the analyzed data
        this.lastAnalysisTime = now;
      }

      this.animationFrame = requestAnimationFrame(analyze);
    };

    analyze();
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  getAverageFrequency() {
    if (!this.isInitialized) return 0;
    return this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
  }

  getBassFrequency() {
    if (!this.isInitialized) return 0;
    const bassRange = Math.floor(this.dataArray.length * 0.1);
    return this.dataArray.slice(0, bassRange).reduce((sum, value) => sum + value, 0) / bassRange;
  }

  getTrebleFrequency() {
    if (!this.isInitialized) return 0;
    const trebleRange = Math.floor(this.dataArray.length * 0.2);
    return this.dataArray.slice(-trebleRange).reduce((sum, value) => sum + value, 0) / trebleRange;
  }

  getFrequencyData() {
    if (!this.isInitialized) return [];
    return Array.from(this.dataArray);
  }
}

export default Analyzer;