const CURRENT_STATUS = {
  recording: 'recording',
  start: 'start',
  finish: 'finish',
}
const CAPTURE_SITES = [];
const maxTime = 600000;

let interval;
let timeLeft;
let currentStatus = CURRENT_STATUS.start;


function renderStatus({tag, status}) {
  tag.innerHTML = status;
}

function initPopupApp () {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const status = document.getElementById("status");
    const timeRem = document.getElementById("timeRem");
    const startButton = document.getElementById('start-cta');
    const saveButton = document.getElementById('save-cta');
    const stopButton = document.getElementById('stop-cta'); 

    // TODO:LATER
    // if(tabs[0].url.toLowerCase().includes("name"))
    // return
    // only accept dialer sites (CAPTURE_SITES).

      chrome.runtime.sendMessage({currentTab: tabs[0].id}, (response) => {
        if(response) {
          chrome.storage.sync.get({
            maxTime: maxTime,
            limitRemoved: false
          }, (options) => {
            if(options.maxTime > maxTime) {
              chrome.storage.sync.set({
                maxTime: maxTime
              });
              timeLeft = maxTime - (Date.now() - response)
            } else {
              timeLeft = options.maxTime - (Date.now() - response)
            }
            renderStatus({tag: status, status: "Recording"});
            if(options.limitRemoved) {
              renderStatus({tag: timeRem, status: `${parseTime(Date.now() - response)}`});
              interval = setInterval(() => {
                renderStatus({tag:timeRem, status: `${parseTime(Date.now() - response)}`});
              });
            } else {
              renderStatus({tag: timeRem, status: `${parseTime(timeLeft)} remaining`});
              interval = setInterval(() => {
                timeLeft = timeLeft - 1000;
              renderStatus({tag: timeRem, status: `${parseTime(timeLeft)} remaining`});
              }, 1000);
            }
          });
          saveButton.style.display = "block";
          stopButton.style.display = "block";
        } else {
          startButton.style.display = "block";
        }
      });
    // }
  });
}

const parseTime = function(milliseconds) {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;
  hours = hours % 24;

  return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}:${padTo2Digits(
    seconds,
  )}`;
  function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }
}

chrome.runtime.onMessage.addListener((request) => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const status = document.getElementById("status");
    const timeRem = document.getElementById("timeRem");
    const startButton = document.getElementById('start-cta');
    const saveButton = document.getElementById('save-cta');
    const stopButton = document.getElementById('stop-cta');
    if(request.captureStarted && request.captureStarted === tabs[0].id) {
      chrome.storage.sync.get({
        maxTime: maxTime,
        limitRemoved: false
      }, (options) => {
        if(options.maxTime > maxTime) {
          chrome.storage.sync.set({
            maxTime: maxTime
          });
          timeLeft = maxTime - (Date.now() - request.startTime)
        } else {
          timeLeft = options.maxTime - (Date.now() - request.startTime)
        }
        status.innerHTML = "Recording";
        if(options.limitRemoved) {
          timeRem.innerHTML = `${parseTime(Date.now() - request.startTime)}`;
          interval = setInterval(() => {
            timeRem.innerHTML = `${parseTime(Date.now() - request.startTime)}`
          }, 1000);
        } else {
          timeRem.innerHTML = `${parseTime(timeLeft)} remaining`;
          interval = setInterval(() => {
            timeLeft = timeLeft - 1000;
            timeRem.innerHTML = `${parseTime(timeLeft)} remaining`;
          }, 1000);
        }
      });
      saveButton.style.display = "block";
      stopButton.style.display = "block";
      startButton.style.display = "none";
    } else if(request.captureStopped && request.captureStopped === tabs[0].id) {
      status.innerHTML = "";
      saveButton.style.display = "none";
      stopButton.style.display = "none";
      startButton.style.display = "block";
      timeRem.innerHTML = "";
      clearInterval(interval);
    }
  });
});


document.addEventListener('DOMContentLoaded', function() {
  initPopupApp();

  const startButton = document.getElementById('start-cta');
  const saveButton = document.getElementById('save-cta');
  const stopButton = document.getElementById('stop-cta');
  startButton.onclick = () => {chrome.runtime.sendMessage("startCapture")};
  saveButton.onclick = () => {chrome.runtime.sendMessage("stopCapture")};
  stopButton.onclick = () => {chrome.runtime.sendMessage("cancelCapture")};
});
