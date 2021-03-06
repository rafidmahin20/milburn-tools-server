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

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'Forbidden access' })
      }
      req.decoded = decoded;
      next();
    });
  }

async function run(){
    try{
        await client.connect()
        const toolCollection = client.db('milburn_tools').collection('tools');
        const orderCollection = client.db('milburn_tools').collection('orders');
        const reviewCollection = client.db('milburn_tools').collection('reviews');
        const userCollection = client.db('milburn_tools').collection('users');
        const profileCollection = client.db('milburn_tools').collection('profiles');

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

        app.get('/review', async(req, res) =>{
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        app.post('/review', async(req, res) =>{
            const newReview = req.body;
            const result = await reviewCollection.insertOne(newReview);
            res.send(result);
        })

        app.post('/tool', async(req, res) =>{
            const newItem = req.body;
            const result =await toolCollection.insertOne(newItem);
            res.send(result);
        })

        app.post('/profile', async(req, res) =>{
            const newProfile = req.body;
            const result = await profileCollection.insertOne(newProfile);
            res.send(result);
        })

        app.get('/order', async(req, res) =>{
            const customerEmail = req.query.customerEmail;
            const query = {customerEmail: customerEmail};
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        })

        app.post('/order', async(req, res) =>{
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        app.delete('/tool/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = toolCollection.deleteOne(query);
            res.send(result);
        })

        app.get('/user', verifyJWT, async(req, res) =>{
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        app.get('/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const user = await userCollection.findOne({email: email});
            const isAdmin = user.role === 'admin';
            res.send({admin: isAdmin});
        })

        app.put('/user/admin/:email', verifyJWT, async(req, res) =>{
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({email: requester});
            if(requesterAccount.role === 'admin'){
                const filter = {email:email};
            const updateDoc = {
                $set: {role:'admin'},
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
            }
            else{
                res.status(403).send({message: 'forbidden'});
            }
            
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