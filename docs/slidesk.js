
  window.slidesk = {
    currentSlide: 0,
    slides: [],
    animationTimer: 300,
    onSlideChange: function() {window.slidesk.changeSource();window.slidesk.qrcode();  document.getElementById("sd-progress").style.width = (100 * (window.slidesk.currentSlide + 1)) / window.slidesk.slides.length + "%";window.slidesk.autonext();console.log("new slide")},
    env: {"PLUGINS":"source, qrcode, progress, keyboard, autonext","MYVAR":"Variable env","WIDTH":"1920"},
    lastAction: ""
  };
  
  window.slidesk.sendMessage = (payload) => {
  window.slidesk.waitForSocketConnection(payload);
};

window.slidesk.waitForSocketConnection = (payload) => {
  setTimeout(() => {
    if (window.slidesk.io?.readyState === 1) window.slidesk.io.send(payload);
    else window.slidesk.waitForSocketConnection(payload);
  }, 5);
};

if (window.slidesk.io) {
  window.slidesk.io.onmessage = (event) => {
    const { action } = JSON.parse(event.data);
    if (action === "reload") window.location.reload();
    else if (window.slidesk[action]) window.slidesk[action]();
  };
}

window.slidesk.cleanOldSlide = (id) => {
  window.slidesk.slides[id].classList.remove("sd-current", "no-sd-animation");
};

window.slidesk.changeSlide = () => {
  window.slidesk.slides[window.slidesk.currentSlide].classList.remove(
    "sd-previous",
  );
  window.slidesk.slides[window.slidesk.currentSlide].classList.add(
    "sd-current",
  );
  window.location.hash =
    window.slidesk.slides[window.slidesk.currentSlide].getAttribute(
      "data-slug",
    );
  if (window.slidesk.io) {
    window.slidesk.sendMessage(
      JSON.stringify({
        action: "current",
        payload: window.slidesk.slides[
          window.slidesk.currentSlide
        ].outerHTML.replace(/data-source="(^["])"/gi, ""),
      }),
    );
    window.slidesk.sendMessage(
      JSON.stringify({
        action: "future",
        payload:
          window.slidesk.currentSlide !== window.slidesk.slides.length - 1
            ? window.slidesk.slides[
                window.slidesk.currentSlide + 1
              ].outerHTML.replace(/data-source="(^["])"/gi, "")
            : "",
      }),
    );
  }

  window.slidesk.slides[window.slidesk.currentSlide]
    .querySelectorAll(".sd-img img")
    .forEach((i) => {
      i.setAttribute("style", "");
      i.setAttribute("src", i.getAttribute("src"));
    });
  window.slidesk.onSlideChange();
};

window.slidesk.next = () => {
  if (window.slidesk.currentSlide !== window.slidesk.slides.length - 1) {
    window.slidesk.lastAction = "next";
    window.slidesk.cleanOldSlide(window.slidesk.currentSlide);
    window.slidesk.slides[window.slidesk.currentSlide].classList.add(
      "sd-previous",
    );
    window.slidesk.currentSlide += 1;
    window.slidesk.changeSlide();
  }
};

window.slidesk.previous = () => {
  if (window.slidesk.currentSlide !== 0) {
    window.slidesk.lastAction = "previous";
    window.slidesk.cleanOldSlide(window.slidesk.currentSlide);
    window.slidesk.currentSlide -= 1;
    window.slidesk.changeSlide();
  }
};

window.slidesk.fullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

window.onload = () => {
  window.slidesk.slides = document.querySelectorAll(".sd-slide");
  if (window.slidesk.io) {
    const timerCheckpoints = {};
    window.slidesk.slides.forEach((slide) => {
      timerCheckpoints[slide.getAttribute("data-num")] = slide.getAttribute(
        "data-timer-checkpoint",
      );
    });
    window.slidesk.sendMessage(
      JSON.stringify({
        action: "checkpoints",
        payload: {
          timerCheckpoints,
          nbSlides: window.slidesk.slides.length,
        },
      }),
    );
  }
  const loadingHash = window.location.hash.replace("#", "").split("+");
  const slugs = [];
  window.slidesk.slides.forEach((slide, i) => {
    slugs.push(slide.getAttribute("data-slug"));
  });
  window.slidesk.currentSlide = slugs.indexOf(loadingHash[0]);
  if (loadingHash.length > 1)
    window.slidesk.currentSlide += Number(loadingHash[1]);
  if (window.slidesk.currentSlide < 0) window.slidesk.currentSlide = 0;
  if (window.slidesk.currentSlide) {
    for (let i = 0; i < window.slidesk.currentSlide; i += 1) {
      window.slidesk.slides[i].classList.add("sd-previous", "no-sd-animation");
    }
    setTimeout(() => {
      for (let i = 0; i < window.slidesk.currentSlide; i += 1) {
        window.slidesk.slides[i].classList.remove("no-sd-animation");
      }
    }, window.slidesk.animationTimer);
  }
  window.slidesk.slides[window.slidesk.currentSlide].classList.add(
    "sd-current",
    "no-sd-animation",
  );
  document.querySelectorAll(".sd-img img").forEach((img) =>
    img.addEventListener("load", () => {
      let ratio = 1;
      if (Number(window.slidesk.env.WIDTH))
        ratio = window.innerWidth / Number(window.slidesk.env.WIDTH);
      const newW = ratio * img.width + "px";
      const newH = ratio * img.height + "px";
      img.parentElement.style.width = newW;
      img.parentElement.style.height = newH;
      img.style.width = newW;
      img.style.height = newH;
    }),
  );
  window.slidesk.changeSlide();
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      window.slidesk.previous();
    } else if (e.key === "ArrowRight" || e.key === " ") {
      window.slidesk.next();
    }
  });
  document.querySelectorAll(".sd-slide").forEach((slide) => {
    slide.addEventListener("touchstart", (e) => {
      e.preventDefault();
      window.slidesk.touchStart = e.touches[0].pageX;
      window.slidesk.touchMove = e.touches[0].pageX;
    });
    slide.addEventListener("touchmove", (e) => {
      window.slidesk.touchMove = e.touches[0].pageX;
    });
    slide.addEventListener("touchend", (e) => {
      if (
        Math.abs(window.slidesk.touchMove - window.slidesk.touchStart) > 100
      ) {
        if (window.slidesk.touchMove > window.slidesk.touchStart)
          window.slidesk.previous();
        else window.slidesk.next();
      }
      window.slidesk.touchStart = 0;
    });
  });
  window.slidesk.timeoutResize = false;
  window.addEventListener("resize", () => {
    clearTimeout(window.slidesk.timeoutResize);
    window.slidesk.timeoutResize = setTimeout(() => {
      window.location.reload();
    }, 250);
  });
};
