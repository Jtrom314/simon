const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const uuid = requrie('uuid');

const userName = process.env.MONGOUSER;
const password = process.env.MONGOPASSWORD;
const hostname = process.env.MONGOHOSTNAME;

if (!userName) {
    throw Error('Database not configured. Set environment variables');
}


const url = `mongodb+srv://${userName}:${password}@${hostname}`;
console.log("URL:  " + url);

const client = new MongoClient(url, {useUnifiedTopology: true });
const scoreCollection = client.db('simon').collection('score');
const userCollection = client.db('simon').collection('user');

function getUser(email) {
    return userCollection.findOne({ email: email});
}

function getUserByToken(token) {
    return userCollection.findOne({ token: token });
}

async function createUser(email, password) {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
        email: email,
        password: passwordHash,
        token: uuid.v4(),
    };
    await userCollection.insertOne(user);
    return user;
}

 function addScore(score) {
    console.log("IN ADD SCORE");
    scoreCollection.insertOne(score);
}

 function getHighScores(score) {
    const query = {};
    const options = {
        sort: { score: -1},
        limit: 10,
    };
    const cursor = scoreCollection.find(query, options);
    return cursor.toArray();
}

module.exports = { 
    addScore, 
    getHighScores,
    getUser,
    getUserByToken,
    createUser,    
};