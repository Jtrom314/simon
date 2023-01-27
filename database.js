const { MongoClient } = require('mongodb');

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

module.exports = { addScore, getHighScores };