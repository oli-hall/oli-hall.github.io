---
layout: post
title: "Fixing a Jupyter kernel connection issue"
date: 2019-03-14 16:20
categories: posts
comments: true
---

Another quick post, this time around [Jupyter notebooks](https://jupyter.org/). I quite often use these for prototyping and playing around with ideas in Python, and I tend to have a scratchpad notebook in most of my projects. However, in a recent project, after pip installing `jupyter`, I found myself with a kernel that refused to connect. Checking the console output (the output in the terminal window used to launch the Jupyter notebook server), I found the following:

```
[I 14:36:02.130 NotebookApp] Kernel started: 3e7f0bc3-6b24-4a95-b0cf-b729ac4dccd8
[I 14:36:02.788 NotebookApp] Adapting to protocol v5.1 for kernel 3e7f0bc3-6b24-4a95-b0cf-b729ac4dccd8
/Users/oli-hall/Code/pymidi/bin/env/lib/python3.5/site-packages/notebook/base/zmqhandlers.py:284: RuntimeWarning: coroutine 'get' was never awaited
  super(AuthenticatedZMQStreamHandler, self).get(*args, **kwargs)
```

This didn't look particularly great. Something low down was clearly not working as it should. Fortunately, in this age of Google and Stack Overflow, [the answer](https://stackoverflow.com/questions/54963043/jupyter-notebook-no-connection-to-server-because-websocket-connection-fails) was not far away. It seems that `jupyter` depends on the `tornado` web server, and doesn't pin the dependency. This means that right now, installing `jupyter` installs `tornado` 6.0, which apparently is throwing these ZeroMQ issues that are causing the kernel to disconnect from the notebook somehow (I've been meaning to dig deeper, but have yet to find the time). Anyhow, forcing a downgrade of `tornado` with pip to 5.1.1 solves the issue:

```
pip uninstall tornado
pip install tornado==5.1.1
```

If you want to dig in deeper, there's [an issue open](https://github.com/jupyter/notebook/issues/4399) on the Jupyter GitHub project to track it.