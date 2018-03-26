---
layout: post
title: "Connecting services behind IAP on App Engine"
date: 2018-03-26 18:32
categories: posts
comments: true

---

It's been a while since I last posted. Life has been hectic, I've started a new job at a different company, and am diving into a whole new world of interesting problems that need solving. Mostly at the moment, that revolves around [Google AppEngine](https://cloud.google.com/appengine/), and [IAP](https://cloud.google.com/iap/). 

## Deployment from scratch

I've had a fair amount of experience building micro-services in Python (mostly using Bottle or Flask), but deployment has generally been a non-issue, thanks to working at larger companies with established deployment procedures. This time, however, I've been building up things from scratch, and have been figuring things out as I go along. On the one hand, I get to decide how everything is done, but on the other... I have to decide how everything is done. An early decision to stick with [GCP](https://cloud.google.com) meant that at least I wasn't facing the bewildering array of cloud deployment options available to the modern developer, but it _did_ mean I needed to figure out AppEngine.

## Baby steps

[Coding in Python](https://cloud.google.com/appengine/docs/python/) also narrowed down the choices somewhat within AppEngine. I had either the ['Standard' environment](https://cloud.google.com/appengine/docs/standard/python/), or the mysterious ['Flexible'](https://cloud.google.com/appengine/docs/flexible/python/). Standard sounded like an excellent choice, until, some way into the docs, I realised that Standard is a super-controlled environment, where you basically write endpoints and nothing else. It's a very locked down setup, with specific routes defined, only Python 2.7 allowed, no custom Python libraries... This allows Google to do some nifty stuff in terms of auto-scaling up and down (you can default a Standard app to be off most of the time, and only scale up when traffic hits!), but if you have a custom application using its own server code, it's a non-starter.

So, 'Flexible' it is. Unfortunately this, too, whilst less restrictive, still constrains the application somewhat. You can configure Python versions, install custom packages, but you have to have a single main Python file or standard entrypoint for your application. I'd already written a nice bash wrapper that handles virtualenv setup and dependency installs, and was a little loath to ditch it immediately, which made things tricky. Fortunately, there's a `runtime: custom` setting in the app's `app.yaml`, which basically says 'I'm doing my thing, I'll handle it'. For this approach, you define a Dockerfile, with a `CMD` instruction specifying the command to launch your app. This fit much more nicely with my usecase, and once I had that figured out, things became fairly straight-forward - pull from the standard AppEngine image, add a few extra packages, install dependencies, and Bob's a close family relation. [This](https://github.com/GoogleCloudPlatform/python-docs-samples/tree/master/appengine/flexible/extending_runtime) example from the official examples repo proved useful as a guide to how things should be set up. One potential gotcha to note: make sure you exclude your local virtualenv directory using `.dockerignore`, otherwise your installation procedure will likely get very confused!

## Locking things down

So, I now had my app deployed, but it's now accessible to the world, which isn't ideal for an internal tool! Fortunately, I'd seen something called [IAP](https://cloud.google.com/iap/) - Identity-Aware Proxy. This sticks a proxy layer in front of your app, and allows you to restrict access by the various Google-y methods - Users, Groups, Domains, etc. This was perfect - I could just lock it down to members of our company, and job done.

This actually proved pretty straight-forward - I set up a basic landing screen (you can either have the standard Google one with your app logo or (I believe) a custom landing page), told it what AppEngine app to restrict, and that was that. Once I started using other services than `default`, I had to add the URIs as 'Authorised redirect URIs' (`https://<service>-dot-<project-id>.appspot.com/_gcp_gatekeeper/authenticate`), but that was pretty straightforward. Sweet, my app is up and running, and locked down to the right people... nice!

## Onwards and.. upwards?

microservices

easy to setup multiple services

not sure on how best to utilise services

once they start needing to talk to one another

fun happens

no CORS

get crazy errors when trying to talk from one to another

enter the IAP workaround

seems to work, but needs tidying

HTTP/HTTPS still proving an issue
