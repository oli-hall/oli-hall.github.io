---
layout: post
title: "Launching Sublime Text from the Command Line"
date: 2019-02-18 15:51
categories: posts
comments: true
---

This is a quick post, serving more as a reminder to future me about how to launch Sublime Text from the command line in OS X. I get very used to opening up folders and files in Sublime Text with a quick `subl <file or folder>`, and whenever I move to a new laptop, I fail to remember the magic invocation required to set it up. No more!

Sublime Text, once installed, sits in `/Applications` as expected. It comes with the `subl` launcher script to open files and folders, so all that remains is to sym-link the installed `subl` script to somewhere more useful (like a directory that's on your path).

 First step is to make sure that the folder you want the sym-link to live in is in your path. I tend to put such things in `usr/local/bin`, so check your path with `echo $PATH`, and see if it's already there. If not, then add it in your bash file of choice (`.bash_profile`, `.bashrc`, etc, substitute as appropriate if you're using another shell). 

 The second step is to create the sym-link (`-s` for symbolic link):

 ```bash
 ln -s /Applications/Sublime\ Text.app/Contents/SharedSupport/bin/subl /usr/local/bin/subl
 ```

 (It's probably worth double-checking that Sublime Text has installed here - it should do, but different OS X versions/Sublime Text verisons may do different things!). And with that, you're done - `subl` to your heart's content!