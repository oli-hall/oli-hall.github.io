---
layout: post
title: "Overenthusiastic CHOWNership"
date: 2017-10-17 21:16
categories: posts
comments: true
---

I did something rather foolish this morning. I ran 
```sudo chown -R <my user> /usr/bin```.
I’ll let that sink in for a sec.

Yep, I’m an idiot. I’d like to have some great excuse, but, ultimately, I wasn’t really thinking. However, not one to let a good opportunity/disaster go to waste, I thought I’d discuss why this is a terrible idea, and how to fix it. I’m not the best at Linux-y things (hence why I ended up doing this in the first place), but figured this is a good learning experience :D

### Why is this bad?

You may’ve looked at the above line and thought ‘That doesn’t look so bad’. So what is going on here? [`chown`](https://linux.die.net/man/1/chown), as the name suggests, is a Linux/OS X util that *ch*anges *own*ership of files and directories. This can be extremely handy to give other people access to files and folders, or to set permissions. The trouble comes from a couple of areas.

Firstly, `/usr/bin`. What is this? In the words of [‘The Complete Linux Command Line’](http://linuxcommand.org/tlcl.php) (an excellent book, highly recommended for Linux newbies all the way to advanced users), “`/usr/bin` contains the executable programs installed by your Linx distribution. It is not uncommon for this directory to hold thousands of programs”. Essentially, this is where all utils and programs that keep everything running smoothly in Unix-land live.

Secondly, I used `sudo` and `-R`. `sudo` will run this as root, ensuring that no permissions issues will scupper the running of this to completion. `-R` runs it recursively, meaning even nested files and folders are not safe from the repercussions.

tl;dr I’m changing the permissions of every (system and user) util on my laptop so that they’re owned by me. This is a baaad idea. As we shall see…

I didn’t notice immediately, in fact all was fine until I wanted to `sudo` another command. Suddenly I get a an error:

```sudo: effective uid is not 0, is sudo installed setuid root?```

This doesn’t look good. My knowledge of Unix is decent enough to tell me that UID means ‘User ID’, and UID 0 is the `root` user. I had a sinking feeling as I realised what I’d done: I’d changed ownership of `sudo` from `root` to my user! This is a fun one, as because `sudo` is no longer owned by root, you can’t change it back. A quick search revealed that this was indeed the cause. More worryingly, the [threads](https://www.linuxquestions.org/questions/linux-newbie-8/sudo-effective-uid-is-not-0-is-sudo-installed-setuid-root-4175438614/) that I found suggested that the only way to fix this was likely a full system reinstall. Not what you want to hear at 10am on a weekday! I played around with modifying permissions on `sudo` (fortunately `chmod` was not completely borked), but despite being able to give it almost every permission, I still wasn’t able to get it to the point of being able to `chown` it back.

After poking around a bit, a friend pointed me in the direction of a [downloadable `sudo`](https://www.sudo.ws/download.html#binary). What could go wrong? Not having a whole lot of choice, I took the plunge, downloaded and installed it. Fortunately, it worked fine, and I was able to use the new shiny `/usr/local/bin/sudo` to reset my `/usr/bin/sudo` back to `root` ownership. Hooray!

However, I knew that `sudo` was but one of the potentially thousands of programs in `/usr/bin` that I’d unwittingly modified. I needed to sort out the rest, but how? Here, running on OS X saved my bacon massively. The first error I encountered was opening a new Terminal window:

```Last login: Tue Oct 17 11:25:56 on console login(<hex value>) malloc: * error for object <another hex value>: pointer being freed was not allocated * set a breakpoint in malloc_error_break to debug
[Process completed]
```

This looking fairly cryptic, I searched for the error, and immediately was taken to an immensely helpful [StackOverflow post](https://stackoverflow.com/questions/22329005/mac-terminal-pointer-being-freed-was-not-allocated-error-when-opening-termin) which not only diagnosed the issue as permissions in `/usr/bin`, but pointed me towards [OnyX](https://www.titanium-software.fr/en/onyx.html), a free analogue of Disk Utility, which amongst its many capabilities, has a handy ‘fix permissions’ function. Win!

Tl;dr after running the full scan and permissions fix, and a very long log of all the things that needed fixing later, my `/usr/bin` permissions are back to normal, _without_ a system reinstall. Still, I wouldn’t recommend `chown`ing `/usr/bin` any time soon!
