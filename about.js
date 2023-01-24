const { response } = require("express");

function displayPicture() {
    const random = Math.floor(Math.random() * 1000);
    fetch(`https://picsum.photos/v2/list?page=${random}&limit=1`)
        .then((response) => response.json())
        .then((data) => {
            const containerEl = document.querySelector('#picture');
            const width  = containerEl.offsetWidth;
            const height = containerEl.offsetHeight;

            const imgUrl = `https://picsum.photos/id/${data[0].id}/${width}/${height}?grayscale`;
            const imgEl = document.createElement('img');
            imgEl.setAttribute('scr', imgUrl);
            containerEl.appendChild(imgEl);
        });
}

function displayQuote(data) {
    fetch('https://api.quoteable.io/random')
        .then((response) => response.json())
        .then((data) => {
            const containerEl = document.querySelector('#quote');
            const quoteEL = document.createElement('p');
            quoteEL.classList.add('quote');
            const authorEL = document.createElement('p');
            authorEL.classList.add('author');

            quoteEL.textContent = data.content;
            authorEL.textContent = data.author;
            containerEl.appendChild(quoteEL);
            containerEl.appendChild(authorEL);
        });
}

displayPicture();
displayQuote();