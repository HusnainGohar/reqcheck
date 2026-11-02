export default {
  input: '.build/app.js',
  external: ['react', 'react-dom', 'react-router-dom', 'react-query'],
  output: {
    file: 'app.js',
    format: 'iife',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      'react-router-dom': 'ReactRouterDOM',
      'react-query': 'ReactQuery'
    }
  },
  onwarn(warning, warn) {
    // TypeScript's ES5 helpers probe top-level `this`; ES modules intentionally use undefined.
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    if (warning.code === 'UNRESOLVED_IMPORT' || warning.code === 'CIRCULAR_DEPENDENCY') {
      throw new Error(warning.message);
    }
    warn(warning);
  }
};
