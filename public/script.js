let input = document.querySelector("input");
let bouton = document.querySelector("button");
let audio = new Audio();

bouton.onclick = function() {
    let url = input.value;
    console.log("URL envoyée :", url);

    audio.src = "/stream?url=" + encodeURIComponent(url);
    audio.play();
};