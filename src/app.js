require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const winston = require('winston')
const uuid = require('uuid/v4')
const { NODE_ENV } = require('./config')

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json())

const cards = [{
  id: 1,
  title: 'Task One',
  content: 'This is card one'
}];
const lists = [{
  id: 1,
  header: 'List One',
  cardIds: [1]
}];

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({filename: 'info.log'})
  ]
})

app.get('/', (req,res) => {
    res.send('Hello, world!')
})



app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN
  const authToken = req.get('Authorization')


  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`)
    return res.status(401).json({ error: 'Unauthorized request' })
  }
  // move to the next middleware
  next()
})

//////////////GET CARD/////////////
app.get('/card',(req,res) => {
  res.json(cards)
})

app.get('/card/:id',(req,res) => {
  const { id } = req.params;
  const card = cards.find(c => c.id == id);

  if (!card) {
    logger.error(`Card with id ${id} not found.`);
    return res
      .status(404)
      .send('Card Not Found');
  }

  res.json(card);
})



//////////////GET LIST////////////
app.get('/list',(req,res) => {
  res.json(lists)
})

app.get('/list/:id', (req,res) => {
  const { id }  = req.params;
  const list = lists.find(li => li.id == id);

  if(!list){
    logger.error(`List with id ${id}  not found`);
    return res.status(404).send('List Not Found')
  }
  res.json(list)
})

//////////////POST CARD////////////
app.post('/card',(req,res) => {
  const {title, content } = req.body;
  const id = uuid()

  const card = {id,title,content}
  cards.push(card)

  if(!title){
    logger.error('title is required')
    return res.status(400).send('invalid data')
  }
  if(!content){
    logger.error('content is required')
    return res.status(400).send('invalid data')
  }
  logger.info(`Card with id ${id} created`)

  res.status(201).location(`http://localhost:8000/card/${id}`).json(card)
})

/////////////POST LIST////////////////
app.post('/list', (req,res) => {
  const {header, cardIds = []} = req.body;
  console.log(req.body)

  if(!header){
    logger.error(`Header is required`)
    return res.status(400).send('Invalid data')
  }

  //check cardIDs
  if (cardIds.length > 0) {
    let valid = true;
    cardIds.forEach(cid => {
      const card = cards.find(c => c.id == cid);
      if (!card) {
        logger.error(`Card with id ${cid} not found in cards array.`);
        valid = false;
      }
    });

    if (!valid) {
      return res
        .status(400)
        .send('Invalid data');
    }
  }


  const id = uuid()

  const list = {id,header,cardIds}

  lists.push(list)
  logger.info(`list with id ${id} created`)
  
  res
  .status(201)
  .location(`http://localhost:8000/list/${id}`)
  .json(list);
})


app.use(function errorHandler(error, req, res, next) {

       let response
       if (NODE_ENV === 'production'){
         response = { error: { message: 'server error' } }
       } else {
         console.error(error)
         response = { message: error.message, error }
       }
       res.status(500).json(response)
     })

module.exports = app