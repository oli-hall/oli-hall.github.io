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

Of course, one service does not make an architecture. I've become a big fan of microservices in the right circumstances (with caveats), and I'd actually already split the single service into several. As it turns out, AppEngine supports multiple services per project (you specify a `service: <service name>` in your `app.yaml` configuration), although you need to deploy a 'default' service first (I believe the idea is to deploy the main service as default, then other named services in support of that).

However, one issue I ran into was getting my apps to talk to one another. I had what I thought was a simple enough setup - A main webserver, with JS frontend, which then fetched data from another RESTful API. My original, rather naive approach was to pass the address for my API through to the frontend JS, and call it directly through there. This runs into [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) issues, but I was hoping that setting appropriate CORS headers on the called API would alleviate this. Enter problem the first.

My API is implemented using [Bottle](http://bottlepy.org/docs/dev/), and I used the [hooks plugin](bottlepy.org/docs/dev/recipes.html#using-the-hooks-plugin) to insert the CORS headers after each request. However, once the service was deployed, the CORS headers weren't present. I tried in a few different ways, but it seemed pretty consistent. I then moved to a custom CORS plugin, that wraps each request with a handler that adds CORS header (more or less the same approach, just a different implementation), but no dice - still no CORS headers on the deployed API. 

I dug around a fair bit, and Standard environment nodes have a configuration option on Google App Engine to set up CORS, but Flexible environments have no such thing. I'm not sure yet if this means CORS is not supported on Flexible environments, or if there is no support at all. Either way, I couldn't find anything much. Given that, a new approach was needed.

## Mmm, tasty OAuth

To avoid CORS, step one was to make the request come from the backend of my JS webapp. This meant the slightly messy step of adding in an API call on the backend that then called out to the REST API. This avoided the CORS issues, but still ran into issues, as the REST API is still behind IAP and hence can't be directly connected without authentication. After a lot of digging, I eventually found [a guide to authenticating with IAP in Python](https://cloud.google.com/iap/docs/authentication-howto) - it basically makes fetches an Open ID Connect token using the Client ID of the IAP OAuth. This is a bit of a pain, but it does work!

## Longer term

This works for now, but in the longer term, I'd like to get some form of private sub-network set up, so that my apps can talk to each other without needing to authenticate. They're all on AppEngine in the same project, it doesn't seem unreasonable that they should be able to communicate fine. This could also help lock down the internal API, avoiding the need for IAP on anything bar the public-facing webapp. I'd also like to look further into how best to call external APIs from client-side JS - I feel like this should be a direct connection, but that makes for more routes into the network. 
