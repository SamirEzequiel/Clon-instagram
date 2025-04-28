const fs = require('fs');
const postsFile = './models/posts.json';

function getFeed(req, res) {
    const posts = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));
    res.json(posts);
}

module.exports = { getFeed };
