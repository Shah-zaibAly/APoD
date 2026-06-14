# APoD — Astronomy Picture of the Day

A NASA astronomy explorer built with vanilla JavaScript, HTML, and CSS — powered by the NASA APOD API.

## Live Demo

**[ap-o-d.vercel.app](https://ap-o-d.vercel.app/)**

---

## About

APoD is an immersive astronomy dashboard that brings NASA's Astronomy Picture of the Day directly to your browser. Explore breathtaking space imagery and videos, navigate through the entire APOD archive dating back to June 1995, and save your favorite cosmic moments.

Built without any frameworks or libraries. Pure HTML, CSS, and JavaScript.

---

## Features

- Daily astronomy image or video fetched from NASA's APOD API
- Full archive navigation — explore any date from June 16, 1995 to today
- HD image viewer with lightbox for full resolution viewing
- Recent gallery — last 5 days of APOD in one view
- Favorites system with localStorage persistence
- Random date discovery — explore unexpected cosmic moments
- Fully responsive across desktop and mobile

---

## Tech Stack

- HTML5
- CSS3
- JavaScript ES6+
- NASA APOD API
- Vercel — deployment

---

## Getting Started

No installation or dependencies required.

```bash
git clone https://github.com/Shah-zaibAly/APoD.git
cd APoD
```

Open `index.html` directly in your browser or use the VS Code Live Server extension.

To use your own NASA API key — get one free at [api.nasa.gov](https://api.nasa.gov/) and replace the key in `app.js`:

```js
const NASA_API_KEY = 'JLkccE9qnbx62FjjhLQcUAT5iEzsYoXNd5R4KlO1';
```

---

## API Reference

This project uses the [NASA APOD API](https://api.nasa.gov/) — free with registration.

| Endpoint | Usage |
|---|---|
| `/planetary/apod?date={date}` | Fetch APOD for a specific date |
| `/planetary/apod?start_date={start}&end_date={end}` | Fetch APOD for a date range |

---

## What I Learned

- Consuming NASA's REST API using Fetch API and async/await
- Image preloading and race condition handling for smooth media transitions
- Promise-based range fetching for the recent gallery
- localStorage for persistent favorites across sessions
- Loading, error, and empty state handling across multiple UI sections
- Scroll animations and intersection observer for reveal effects

---

## Planned Improvements

- Search by keyword across APOD descriptions
- Download button for full resolution images
- Share functionality for individual APOD entries
- Migration to React with better state management

---

## Author

**Shahzaib Ali**
- GitHub: [Shah-zaibAly](https://github.com/Shah-zaibAly)
- LinkedIn: (https://www.linkedin.com/in/shahzaib-ali-659002374/)
