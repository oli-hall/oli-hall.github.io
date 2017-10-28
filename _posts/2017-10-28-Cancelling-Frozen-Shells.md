---
layout: post
title: "Cancelling Frozen Shells"
date: 2017-10-28 22:41
categories: posts
comments: true
---

I came across a [really useful tip](https://twitter.com/__sw1tch__/status/921157696774201346) the other day, so thought I'd pass it on. Have you ever had an SSH session that's dropped, then been frustrated at the resulting frozen terminal? No more! Simply press **Enter**, then **~** and then **.**. Boom, problem solved!

Don't believe me? It's super easy to check. SSH to a host of your choice, then kill your network connection. The shell with your connection should now be frustratingly frozen. Simply press the three keys above in the correct order, and the connection will be closed, and your shell will be yours once again!

The best part is that this will work even with nested SSH connections - press **Enter**, then as many **~**s as nested connections you have, then **.**. 

So how is this working? This all felt a bit like magic to me, and I'm not the biggest fan of magic. [Turns out](https://apple.stackexchange.com/a/35543) that **~** is the escape character for SSH sessions, and **.** happens to mean 'exit this connection'. In fact, if you have an active session, you can type **Enter** then **~?** to get a list of all the possible actions you can perform:

```bash
oli-hall@remote_host:~$ ~?
Supported escape sequences:
 ~.   - terminate connection (and any multiplexed sessions)
 ~B   - send a BREAK to the remote system
 ~C   - open a command line
 ~R   - request rekey
 ~V/v - decrease/increase verbosity (LogLevel)
 ~^Z  - suspend ssh
 ~#   - list forwarded connections
 ~&   - background ssh (when waiting for connections to terminate)
 ~?   - this message
 ~~   - send the escape character by typing it twice
 ```
