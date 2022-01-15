const mongoose = require('mongoose'); // requerir modulo
mongoose.connect(process.env.MONGO_URI); // conectar a variable de entorno
require('dotenv').config();

// invocar un esquema
const Schema = mongoose.Schema;

// crear un esquema
/*const personSchema = new Schema({
  name: { type: String, required: true },
  age: Number,
  favoriteFoods: [String]
});*/

// asociar esquema
const Person = mongoose.model("Person", personSchema);

export default;