const feed = document.getElementById("feed");

const events = [

"⚔ Rival gang spotted near Harbor",

"💰 Illegal deal earned $2000",

"🚔 Police increased patrols",

"🔥 Downtown influence increased",

"👤 New recruit joined your crew",

"📦 Smuggling route established"

];

function addFeed(text){

const div =
document.createElement("div");

div.className =
"feedItem";

div.innerText =
text;

feed.prepend(div);

}

document
.getElementById("nextDay")
.addEventListener(
"click",
()=>{

const random =
events[
Math.floor(
Math.random()*events.length
)
];

addFeed(random);

}
);

addFeed(
"👑 Welcome Boss."
);
