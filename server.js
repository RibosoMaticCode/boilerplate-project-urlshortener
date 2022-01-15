require('dotenv').config() // para trabajar con variables de entorno. Archivo .env por defecto
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()

// Basic Configuration
const port = process.env.PORT || 3000

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/public', express.static(`${process.cwd()}/public`))

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html')
})

// CONFIGUAR MONGOOSE
const mongoose = require('mongoose') // requerir modulo
mongoose.connect(process.env.MONGO_URI) // conectar a variable de entorno

// VERIFICAMOS CONEXION A MONGO
app.get("/is-mongoose-ok", function (req, res) {
  if (mongoose) {
    res.json({ isMongooseOk: !!mongoose.connection.readyState })
  } else {
    res.json({ isMongooseOk: false })
  }
})

// CREAMOS ESQUEMA
const Schema = mongoose.Schema
const urlSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: { type: String, unique: true },
})
const Url = mongoose.model("Url", urlSchema)

// VALIDAR URL: Credit: https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

// API CONVERT SHORT URL
app.post('/api/shorturl',
  (req, res) => {
    const { url } = req.body

    // si url es valida
    if (isValidHttpUrl(url)) {

      // buscamos la url completa en la DB
      Url.findOne({ original_url: url }, function (err, urlFound) {
        // si hay error
        if (err) {
          res.json({ error: err.message })
        }
        // si encontrado MOSTRARLO
        if (urlFound) {
          res.json({
            original_url: urlFound.original_url,
            short_url: parseInt(urlFound.short_url)
          })
        }
        // si no fue encontrado GUARDARLO
        else {
          // Obtenemos cantidad actual + 1
          Url.count({}, function (err, count) {

            // Alistamos dato a guardar
            const urlNew = new Url({ original_url: url, short_url: count + 1 })

            // Guardamos dato nuevo
            urlNew.save(function (err, data) {
              if (err) res.json({ error: err.message })
              else res.json({
                original_url: data.original_url,
                short_url: parseInt(data.short_url)
              })
            })
          })
        }
      })
      // sino cumple condiciones la url
    } else {
      res.json({ error: 'Invalid URL' })
    }
  }
)

// buscar async/await
async function findBy(field, value) {
  const result = await Url.findOne({ [field]: value });
  return result
}

// buscar dominio por el short_url
app.get('/api/shorturl/:short_url', (req, res) => {

  // capturamos parametro de la url
  let { short_url } = req.params

  // buscamos en DB (alternativa async/await)
  findBy('short_url', short_url)
    .then(urlFound => {

      if (urlFound) {
        res.redirect(urlFound.original_url)
      } else {
        res.json({
          error: 'No short URL found for the given input'
        })
      }

    })
    .catch(err => {
      res.json({ error: 'Invalid URL' })
    })

  // buscamos en DB (alterntiva callback)
  /*Url.findOne({ short_url: short_url }, function (err, urlFound) {
    // si hay error
    if (err) {
      res.json({ error: 'Invalid URL' })
    }
    // si encontrado
    if (urlFound) {
      res.redirect(urlFound.original_url)
    }
    // si no fue encontrado
    else {
      res.json({
        error: 'No short URL found for the given input'
      })
    }
  })*/

})

app.listen(port, function () {
  console.log(`Listening on port ${port}`)
})
