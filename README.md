publishing-automation
========================================

Publish markdown files to PDF


Requirements & Setup
----------------------------------------

### Requirements

- Node.js v18+ 


### Setup

```bash
npm install
```


#### Additional step for WSL

```bash
sudo apt install libgtk-3-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2
```


How to Build
----------------------------------------

### Build demo

```bash
npm run build-demo
```


### Build with options

```bash
AS_HTML=false \
TOC_HEAD='Table of content' \
SRC_DIR='./demo' \
DST_DIR='./dst' \
npm run build
```
