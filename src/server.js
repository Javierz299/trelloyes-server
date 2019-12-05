const app = require('./app')

// const PORT = process.env.PORT || 8000
const { PORT } = require('./config')

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})