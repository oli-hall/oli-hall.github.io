---
layout: post
title: "py-dataproc"
date: 2017-10-21 14:09
categories: posts
cover: py-dataproc.png
---

#### Or how I learned to stop worrying and love OSS development.

I’ve been a big fan of open-source projects for a while - I’ve worked with them for pretty much my entire career - but have until now not really given back much, bar the odd bug-fix here and there. I’ve always failed to find the time, or not seen any opportunities. However, I’ve realised more recently, after talking to a friend, that it’s actually pretty easy to just open-source little tools here and there, and start to give back that way. In that vein, I’ve open-sourced a small Python wrapper I created around the [Google DataProc](https://cloud.google.com/dataproc/) python client, called [py-dataproc](https://github.com/oli-hall/py-dataproc)

Google’s cloud tools are, by and large, amazing. All of the libraries in `google.cloud` are really intuitive and pleasant to use. However, there are a few products that haven’t quite made it there yet, DataProc being one of them. It still uses the older REST API-based client, and is rather clunky to use. Whilst using DataProc elsewhere, I threw a wrapper around it that holds things like your GCP Project ID, Region, etc, and gives a nicer interface to create, list and destroy clusters, as well as submit jobs. It’s a little bare-bones right now, but I’m working to improve it, as I’m using it actively elsewhere. Hopefully someone else will find this useful :D
