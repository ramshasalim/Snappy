const videos = [
  {
    id: 1,
    title: "Big Buck Bunny - Animated Short Film",
    channel: "Minitube Studio",
    views: "12K views",
    category: "Education",
    thumbnail: "https://placehold.co/640x360/333/white?text=Big+Buck+Bunny",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description: "Enjoy this animated short film on Minitube.",
  },
  {
    id: 2,
    title: "Elephants Dream - Open Movie",
    channel: "Creative World",
    views: "8K views",
    category: "Technology",
    thumbnail: "https://placehold.co/640x360/34495e/white?text=Elephants+Dream",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description: "Discover an open movie project.",
  },
  {
    id: 3,
    title: "For Bigger Escapes",
    channel: "Travel Hub",
    views: "5K views",
    category: "Gaming",
    thumbnail: "https://placehold.co/640x360/16a085/white?text=Explore+More",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    description: "A sample video demonstrating Minitube playback.",
  },
  {
    id: 4,
    title: "For Bigger Fun",
    channel: "Fun Station",
    views: "3K views",
    category: "Music",
    thumbnail: "https://placehold.co/640x360/8e44ad/white?text=For+Bigger+Fun",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    description: "Watch entertaining videos on Minitube.",
  },
  {
    id: 5,
    title: "For Bigger Joyrides",
    channel: "Auto World",
    views: "2K views",
    category: "Technology",
    thumbnail: "https://placehold.co/640x360/c0392b/white?text=Joyrides",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    description: "Explore this sample video.",
  },
  {
    id: 6,
    title: "For Bigger Meltdowns",
    channel: "Daily Videos",
    views: "1K views",
    category: "Gaming",
    thumbnail: "https://placehold.co/640x360/2c3e50/white?text=Meltdowns",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    description: "Another sample video for the Minitube demo.",
  },
];

let activeCategory = "All";
let currentPage = "home";
let currentVideo = null;

const videoGrid = document.getElementById("videoGrid");
const homePage = document.getElementById("homePage");
const watchPage = document.getElementById("watchPage");
const uploadPage = document.getElementById("uploadPage");
const searchInput = document.getElementById("searchInput");

function renderVideos(list) {
  videoGrid.innerHTML = "";

  if (list.length === 0) {
    videoGrid.innerHTML = '<p class="empty-message">No videos found.</p>';
    return;
  }

  list.forEach((video) => {
    const card = document.createElement("article");
    card.className = "video-card";

    card.innerHTML = `
            <img class="thumbnail" src="${video.thumbnail}" alt="Video thumbnail">
            <h3></h3>
            <p class="channel"></p>
            <p class="views"></p>
        `;

    card.querySelector("h3").textContent = video.title;
    card.querySelector(".channel").textContent = video.channel;
    card.querySelector(".views").textContent = video.views;

    card.addEventListener("click", () => openVideo(video.id));
    videoGrid.appendChild(card);
  });
}

function getVisibleVideos() {
  let result = [...videos];

  if (currentPage === "trending") {
    result = result.slice().reverse();
  }

  if (currentPage === "liked") {
    result = result.filter((video) => video.liked);
  }

  if (currentPage === "myvideos") {
    result = result.filter((video) => video.uploaded);
  }

  if (currentPage === "history") {
    result = result.filter((video) => video.watched);
  }

  if (activeCategory !== "All") {
    result = result.filter((video) => video.category === activeCategory);
  }

  const query = searchInput.value.trim().toLowerCase();

  if (query) {
    result = result.filter(
      (video) =>
        video.title.toLowerCase().includes(query) ||
        video.channel.toLowerCase().includes(query)
    );
  }

  return result;
}

function refreshVideos() {
  renderVideos(getVisibleVideos());
}

function showPage(page) {
  currentPage = page;

  homePage.classList.toggle(
    "hidden",
    page !== "home" &&
      page !== "trending" &&
      page !== "history" &&
      page !== "liked" &&
      page !== "myvideos"
  );

  watchPage.classList.add("hidden");
  uploadPage.classList.toggle("hidden", page !== "upload");

  if (page !== "upload") {
    document.getElementById("pageTitle").textContent =
      {
        home: "Recommended Videos",
        trending: "Trending Videos",
        history: "Watch History",
        liked: "Liked Videos",
        myvideos: "My Videos",
      }[page] || "Recommended Videos";

    refreshVideos();
  }

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  window.scrollTo(0, 0);
}

function openVideo(id) {
  currentVideo = videos.find((video) => video.id === id);

  if (!currentVideo) return;

  currentVideo.watched = true;

  homePage.classList.add("hidden");
  uploadPage.classList.add("hidden");
  watchPage.classList.remove("hidden");

  document.getElementById("watchTitle").textContent = currentVideo.title;
  document.getElementById("watchViews").textContent = currentVideo.views;
  document.getElementById("watchChannel").textContent = currentVideo.channel;
  document.getElementById("watchDescription").textContent =
    currentVideo.description;

  const player = document.getElementById("videoPlayer");
  player.src = currentVideo.url;
  player.load();

  document.getElementById("likeBtn").textContent = currentVideo.liked
    ? "♥ Liked"
    : "♡ Like";

  renderRelatedVideos();
  window.scrollTo(0, 0);
}

function renderRelatedVideos() {
  const container = document.getElementById("relatedVideos");
  container.innerHTML = "";

  videos
    .filter((video) => video.id !== currentVideo.id)
    .slice(0, 5)
    .forEach((video) => {
      const card = document.createElement("div");
      card.className = "related-card";

      card.innerHTML = `
                <img src="${video.thumbnail}" alt="">
                <div><h4></h4><p></p></div>
            `;

      card.querySelector("h4").textContent = video.title;
      card.querySelector("p").textContent = video.channel;

      card.addEventListener("click", () => openVideo(video.id));
      container.appendChild(card);
    });
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

document.querySelectorAll(".category").forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;

    document
      .querySelectorAll(".category")
      .forEach((item) => item.classList.toggle("active", item === button));

    refreshVideos();
  });
});

document.getElementById("searchBtn").addEventListener("click", refreshVideos);

searchInput.addEventListener("input", refreshVideos);

document.getElementById("backBtn").addEventListener("click", () => {
  document.getElementById("videoPlayer").pause();
  document.getElementById("videoPlayer").removeAttribute("src");
  showPage("home");
});

document.getElementById("likeBtn").addEventListener("click", () => {
  if (!currentVideo) return;

  currentVideo.liked = !currentVideo.liked;

  document.getElementById("likeBtn").textContent = currentVideo.liked
    ? "♥ Liked"
    : "♡ Like";
});

document.getElementById("shareBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    alert("Minitube page link copied!");
  } catch {
    alert("Minitube demo page. Sharing can be connected later.");
  }
});

document.getElementById("uploadBtn").addEventListener("click", () => {
  showPage("upload");
});

document.getElementById("uploadForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const file = document.getElementById("videoFile").files[0];

  if (!file) return;

  const video = {
    id: Date.now(),
    title: document.getElementById("videoTitle").value,
    channel: document.getElementById("channelName").value,
    description: document.getElementById("videoDescription").value,
    category: document.getElementById("videoCategory").value,
    views: "0 views",
    thumbnail: "https://placehold.co/640x360/333/white?text=My+Video",
    url: URL.createObjectURL(file),
    uploaded: true,
  };

  videos.unshift(video);

  document.getElementById("uploadMessage").textContent =
    "Demo upload successful! Your video is available in My Videos.";

  event.target.reset();
});

renderVideos(videos);
