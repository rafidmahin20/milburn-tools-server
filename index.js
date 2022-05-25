const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1ejaeyp.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect()
        const toolCollection = client.db('milburn_tools').collection('tools');
        const reviewCollection = client.db('milburn_tools').collection('reviews');
        const userCollection = client.db('milburn_tools').collection('users');

        app.get('/tool', async(req, res) =>{
            const query = {};
            const cursor = toolCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        })

        app.get('/tool/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const tools = await toolCollection.findOne(query);
            res.send(tools);
        })

        app.post('/tool', async(req, res) =>{
            const newReview = req.body;
            const result = await toolCollection.insertOne(newReview);
            res.send(result);
        })

        app.get('/user', async(req, res) =>{
            const users = await userCollection.find().toArray();
            res.send(users);
        })

        app.put('/user/:email', async(req, res) =>{
            const email = req.params.email;
            const user = req.body;
            const filter = {email:email};
            const options = {upsert: true};
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'})
            res.send({result, token});
        })
    }
    finally{}
}
run().catch(console.dir)

app.get('/', (req, res) =>{
    res.send('hello from milburn tools')
})

app.listen(port,() =>{
    console.log(`tools listening on port ${port}`)
})