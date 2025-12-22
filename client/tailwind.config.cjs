module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      borderColor: (theme) => ({
        border: theme('colors.slate.700')
      })
    }
  },
  plugins: []
}
